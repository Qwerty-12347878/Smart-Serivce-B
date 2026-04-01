import Service from '../models/serviceModel.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404);
      throw new Error('Service not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res, next) => {
  try {
    const { name, category, description, image, price } = req.body;
    const service = new Service({
      name,
      category,
      description,
      image,
      price,
      rating: 0,
      numReviews: 0,
    });
    const createdService = await service.save();
    res.status(201).json(createdService);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    service.name = req.body.name || service.name;
    service.category = req.body.category || service.category;
    service.description = req.body.description || service.description;
    service.image = req.body.image || service.image;
    service.price = req.body.price !== undefined ? req.body.price : service.price;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    await service.remove();
    res.json({ message: 'Service removed' });
  } catch (error) {
    next(error);
  }
};

export { getServices, getServiceById, createService, updateService, deleteService };
