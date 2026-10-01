import Activity from '../models/Activity.js';

/**
 * Asynchronously log a user activity by prepending to the user's activities array.
 * 
 * @param {Object} params
 * @param {string} params.userEmail - User email (required)
 * @param {string} params.type - Activity type: 'create' | 'edit_flip' | 'create_profile' | 'edit' | 'publish' | 'unpublish' | 'send'
 * @param {string} params.title - Activity title
 * @param {string} [params.desc] - Activity description
 * @param {string} [params.entityId] - Associated entity identifier (e.g. flipbook v_id or profile id)
 * @param {string} [params.entityName] - Associated entity name (e.g. flipbook title)
 * @param {Object} [params.metadata] - Extra contextual information
 */
export const logActivity = async ({
  userEmail,
  type,
  title,
  desc = '',
  entityId = '',
  entityName = '',
  metadata = {}
}) => {
  try {
    if (!userEmail || !type || !title) {
      return null;
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const newActivity = {
      type,
      title: title.trim(),
      desc: desc.trim(),
      entityId: String(entityId || ''),
      entityName: String(entityName || ''),
      metadata,
      createdAt: new Date()
    };

    // Prepend to activities array (newest first)
    const updatedUserActivity = await Activity.findOneAndUpdate(
      { userEmail: normalizedEmail },
      {
        $push: {
          activities: {
            $each: [newActivity],
            $position: 0
          }
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return updatedUserActivity;
  } catch (error) {
    console.warn('[Activity Logger] Failed to log activity:', error.message);
    return null;
  }
};

export default logActivity;
