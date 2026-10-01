import TextureCategory from "../../models/TextureCategory.js";
import Texture from "../../models/Texture.js";

export const getCategories = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "User email required" });

    const categories = await TextureCategory.find({ userEmail: email }).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, userEmail } = req.body;
    if (!name || !userEmail) return res.status(400).json({ message: "Name and User Email required" });

    // Use findOneAndUpdate with upsert to avoid duplicate errors and just return the existing/new one
    const category = await TextureCategory.findOneAndUpdate(
        { userEmail, name },
        { userEmail, name },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.status(201).json({ category });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const renameCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "New name required" });

    const category = await TextureCategory.findByIdAndUpdate(id, { name }, { returnDocument: 'after' });
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ category });
  } catch (error) {
    console.error("Error renaming category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearTexturesInCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await TextureCategory.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Delete all textures associated with this category ID
    await Texture.deleteMany({ materialCategory: id });

    res.status(200).json({ message: "All textures in category cleared" });
  } catch (error) {
    console.error("Error clearing textures:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the category itself
    const category = await TextureCategory.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Delete all textures associated with this category
    await Texture.deleteMany({ materialCategory: id });

    res.status(200).json({ message: "Category and its textures deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
