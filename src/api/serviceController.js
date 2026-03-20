import prisma from "../prisma.js";

export const getServices = async (req, res) => {
  try {
    const services = await prisma.authorizedService.findMany();
    return res.status(200).json({ data: services });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getServiceById = async (req, res) => {
  const id = req.body.id;
  if (!Number.isInteger(id))
    return res
      .status(400)
      .json({ error: "ID is required and must be an integer." });

  try {
    const service = await prisma.authorizedService.findFirst({
      where: {
        id: id,
      },
    });
    if (!service) return res.status(404).json({ error: "Service not found." });

    return res.status(200).json({ data: service });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const addService = async (req, res) => {
  const { name, api_key, can_tokenize, can_fetch, can_manage } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required." });
  if (!api_key) return res.status(400).json({ error: "API key is required." });
  if (
    typeof can_fetch !== "boolean" ||
    typeof can_tokenize !== "boolean" ||
    typeof can_manage !== "boolean"
  )
    return res.status(400).json({
      error:
        "Tokenizing, fetching and managing roles are required and must be booleans.",
    });

  try {
    const existingService = await prisma.authorizedService.findFirst({
      where: {
        OR: [{ api_key: api_key }, { name: name }],
      },
    });
    if (existingService)
      return res.status(400).json({
        error: "Service already exists with the given name or api key.",
      });

    const newService = await prisma.authorizedService.create({
      data: {
        name: name,
        api_key: api_key,
        can_fetch: can_fetch,
        can_manage: can_manage,
        can_tokenize: can_tokenize,
      },
    });

    return res
      .status(201)
      .json({ msg: "Service added successfully.", data: newService });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Internal server error." });
  }
};

export const updateService = async (req, res) => {
  const { id, name, api_key, can_fetch, can_manage, can_tokenize } = req.body;
  if (!Number.isInteger(id))
    return res
      .status(400)
      .json({ error: "ID is required and must be an integer." });
  const data = {};

  if (name) data.name = name;
  if (api_key) data.api_key = api_key;
  if (typeof can_fetch === "boolean") data.can_fetch = can_fetch;
  if (typeof can_manage === "boolean") data.can_manage = can_manage;
  if (typeof can_tokenize === "boolean") data.can_tokenize = can_tokenize;

  try {
    const service = await prisma.authorizedService.findFirst({
      where: {
        id: id,
      },
    });
    if (!service) return res.status(404).json({ error: "Service not found" });
    const updatedData = await prisma.authorizedService.update({
      where: {
        id: id,
      },
      data: data,
      select: {
        name: true,
        api_key: true,
        can_fetch: true,
        can_manage: true,
        can_tokenize: true,
      },
    });

    return res
      .status(200)
      .json({ msg: "Service updated successfully.", data: updatedData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const changeServiceActiveness = async (req, res) => {
  const { id } = req.body;
  if (!Number.isInteger(id))
    return res
      .status(400)
      .json({ error: "ID is required and must be an integer." });

  try {
    const service = await prisma.authorizedService.findFirst({
      where: {
        id: id,
      },
    });
    if (!service) return res.status(404).json({ error: "Service not found." });
    await prisma.authorizedService.update({
      where: {
        id: id,
      },
      data: {
        is_active: !service.is_active,
      },
    });

    return res.status(200).json({
      msg: "Service activeness changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

// module.exports = {
//   getServices,
//   getServiceById,
//   addService,
//   updateService,
//   changeServiceActiveness,
// };
