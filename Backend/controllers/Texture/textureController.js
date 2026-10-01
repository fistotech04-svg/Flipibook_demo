import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Texture from "../../models/Texture.js";
import TextureCategory from "../../models/TextureCategory.js";
import { uploadFileToSupabase, deleteFileFromSupabase, deleteFolderFromSupabase } from "../../config/supabase.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addTexture = async (req, res) => {
  try {
    const { materialName, materialCategory, userEmail, maps: existingMaps } = req.body;

    if (!materialName || !materialCategory || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let mappedUrls = {};

    // If maps are already uploaded via chunks, they will be in req.body.maps
    if (existingMaps) {
      try {
        mappedUrls = typeof existingMaps === 'string' ? JSON.parse(existingMaps) : existingMaps;
      } catch (e) {
        return res.status(400).json({ message: "Invalid maps data" });
      }
    } else {
      // Fallback to direct file upload if not using chunks
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No texture maps uploaded" });
      }

      // Required maps check for direct upload
      const requiredMaps = ["base", "metallic", "roughness", "normal"];
      for (const map of requiredMaps) {
        if (!req.files[map]) {
          return res.status(400).json({ message: `${map} map is required` });
        }
      }

      const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
      const sanitizedMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const relativeBaseDir = `/uploads/${sanitizedEmail}/Texture/${sanitizedMaterialName}`;
      
      const mapKeys = ["preview", "base", "metallic", "roughness", "normal", "ao", "displacement", "opacity", "emissive"];
      for (const key of mapKeys) {
        if (req.files[key]) {
          const file = req.files[key][0];
          const destPath = `${sanitizedEmail}/Texture/${sanitizedMaterialName}/${file.filename}`;
          const supabaseUrl = await uploadFileToSupabase(file.path, destPath);
          mappedUrls[key] = supabaseUrl || `${relativeBaseDir}/${file.filename}`;
        } else {
          mappedUrls[key] = null;
        }
      }
    }


    // Verify required maps exist in mappedUrls
    const requiredMapsList = ["base", "metallic", "roughness", "normal"];
    for (const m of requiredMapsList) {
        if (!mappedUrls[m]) return res.status(400).json({ message: `Required map '${m}' is missing` });
    }

    // Resolve materialCategory (Name or Nanoid) to Nanoid
    let categoryId = materialCategory;
    if (typeof materialCategory === 'string') {
        // Try to find if it's already a valid category ID
        const existingById = await TextureCategory.findById(materialCategory);
        if (!existingById) {
            // Assume it's a name, find or create it
            const cat = await TextureCategory.findOneAndUpdate(
                { userEmail, name: materialCategory },
                { userEmail, name: materialCategory },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
            categoryId = cat._id;
        } else {
            categoryId = existingById._id;
        }
    } else if (typeof materialCategory === 'object' && materialCategory?._id) {
        categoryId = materialCategory._id;
    }

    const newTexture = new Texture({
      userEmail,
      materialName,
      materialCategory: categoryId,
      maps: mappedUrls
    });

    await newTexture.save();

    res.status(201).json({
      message: "Material added successfully",
      texture: newTexture
    });
  } catch (error) {
    console.error("Error adding texture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserTextures = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "User email required" });

    const textures = await Texture.find({ userEmail: email })
      .populate('materialCategory')
      .sort({ createdAt: -1 });
    res.status(200).json({ textures });
  } catch (error) {
    console.error("Error fetching textures:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTexture = async (req, res) => {
  try {
    const { id } = req.params;
    const { materialName, materialCategory, maps } = req.body;

    const texture = await Texture.findById(id);
    if (!texture) return res.status(404).json({ message: "Texture not found" });

    if (materialName) texture.materialName = materialName;
    if (materialCategory) {
        let categoryId = materialCategory;
        if (typeof materialCategory === 'string') {
            const existingById = await TextureCategory.findById(materialCategory);
            if (!existingById) {
                const cat = await TextureCategory.findOneAndUpdate(
                    { userEmail: texture.userEmail, name: materialCategory },
                    { userEmail: texture.userEmail, name: materialCategory },
                    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
                );
                categoryId = cat._id;
            } else {
                categoryId = existingById._id;
            }
        } else if (typeof materialCategory === 'object' && materialCategory?._id) {
            categoryId = materialCategory._id;
        }
        texture.materialCategory = categoryId;
    }
    if (maps) {
        for (const key in maps) {
            const oldValue = texture.maps[key];
            const newValue = maps[key];
            
            if (oldValue && oldValue !== newValue) {
                deleteFileFromSupabase(oldValue).catch(e => console.warn(`Could not delete old map file from Supabase ${oldValue}:`, e));
            }
            
            texture.maps[key] = newValue;
        }
    }

    await texture.save();
    res.status(200).json({ message: "Texture updated successfully", texture });
  } catch (error) {
    console.error("Error updating texture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTexture = async (req, res) => {
  try {
    const { id } = req.params;
    const texture = await Texture.findById(id);
    if (!texture) return res.status(404).json({ message: "Texture not found" });

    try {
        const sanitizedEmail = texture.userEmail.replace(/[@.]/g, "_");
        const sanitizedMaterialName = texture.materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Delete map files and folder from Supabase Storage
        const texturePrefix = `${sanitizedEmail}/Texture/${sanitizedMaterialName}`;
        await deleteFolderFromSupabase(texturePrefix);
        if (texture.maps) {
          for (const key of Object.keys(texture.maps)) {
            const mapUrl = texture.maps[key];
            if (mapUrl) {
              await deleteFileFromSupabase(mapUrl);
            }
          }
        }

    } catch (e) {
        console.warn("Could not delete Supabase files:", e);
    }


    await Texture.findByIdAndDelete(id);
    res.status(200).json({ message: "Texture deleted successfully" });
  } catch (error) {
    console.error("Error deleting texture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
