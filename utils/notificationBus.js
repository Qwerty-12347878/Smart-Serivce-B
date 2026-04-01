const subscribers = new Map();

const getRecipientKey = (recipientType, recipientId) => `${recipientType}:${recipientId}`;

const subscribeToNotifications = (recipientType, recipientId, res) => {
  const key = getRecipientKey(recipientType, recipientId);
  const existing = subscribers.get(key) || new Set();

  existing.add(res);
  subscribers.set(key, existing);
};

const unsubscribeFromNotifications = (recipientType, recipientId, res) => {
  const key = getRecipientKey(recipientType, recipientId);
  const existing = subscribers.get(key);

  if (!existing) {
    return;
  }

  existing.delete(res);

  if (existing.size === 0) {
    subscribers.delete(key);
  }
};

const publishNotification = (recipientType, recipientId, payload) => {
  const key = getRecipientKey(recipientType, recipientId);
  const existing = subscribers.get(key);

  if (!existing) {
    return;
  }

  const serializedPayload = `data: ${JSON.stringify(payload)}\n\n`;

  existing.forEach((res) => {
    res.write(serializedPayload);
  });
};

export { subscribeToNotifications, unsubscribeFromNotifications, publishNotification };
