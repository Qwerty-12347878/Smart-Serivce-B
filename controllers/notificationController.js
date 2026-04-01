import Notification from '../models/notificationModel.js';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../utils/notificationBus.js';

const getActor = (req) => {
  if (req.worker) {
    return {
      recipientType: 'worker',
      recipientId: req.worker._id.toString(),
    };
  }

  if (req.user) {
    return {
      recipientType: 'user',
      recipientId: req.user._id.toString(),
    };
  }

  return null;
};

const getMyNotifications = async (req, res, next) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const notifications = await Notification.find({
      recipientType: actor.recipientType,
      recipient: actor.recipientId,
    })
      .populate({
        path: 'booking',
        populate: [
          { path: 'service', select: 'name category image price' },
          { path: 'user', select: 'name email' },
          { path: 'worker', select: 'name email category' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientType: actor.recipientType,
      recipient: actor.recipientId,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

const streamNotifications = async (req, res, next) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401);
      throw new Error('Not authorized');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    subscribeToNotifications(actor.recipientType, actor.recipientId, res);

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribeFromNotifications(actor.recipientType, actor.recipientId, res);
      res.end();
    });
  } catch (error) {
    next(error);
  }
};

export { getMyNotifications, markNotificationAsRead, streamNotifications };
