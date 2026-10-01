import express from 'express';
import Activity from '../../models/Activity.js';

const router = express.Router();

// Helper to format presentation attributes for activity types
const getTypeStyles = (type) => {
  switch (type) {
    case 'create':
      return {
        icon: 'lucide:book-open',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        dot: 'bg-indigo-500'
      };
    case 'edit_flip':
      return {
        icon: 'lucide:edit-3',
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        dot: 'bg-yellow-500'
      };
    case 'delete_flip':
      return {
        icon: 'lucide:trash-2',
        color: 'text-red-500',
        bg: 'bg-red-50',
        dot: 'bg-red-500'
      };
    case 'create_profile':
      return {
        icon: 'lucide:user',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        dot: 'bg-blue-500'
      };
    case 'edit':
      return {
        icon: 'lucide:user',
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        dot: 'bg-yellow-500'
      };
    case 'publish':
      return {
        icon: 'lucide:layout-template',
        color: 'text-green-500',
        bg: 'bg-green-50',
        dot: 'bg-green-500'
      };
    case 'unpublish':
      return {
        icon: 'lucide:eye-off',
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        dot: 'bg-gray-500'
      };
    case 'send':
      return {
        icon: 'lucide:send',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        dot: 'bg-orange-500'
      };
    default:
      return {
        icon: 'lucide:activity',
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        dot: 'bg-gray-500'
      };
  }
};

// Helper to get human date label ('Today', 'Yesterday', or 'Month Day, Year')
const getDateLabel = (dateObj) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper to format time (e.g. "10:30 AM")
const getTimeLabel = (dateObj) => {
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * @route   GET /api/activity
 * @desc    Get paginated and date-grouped activities from user's activities array
 * @access  Public / Authenticated
 */
router.get('/', async (req, res) => {
  try {
    const rawEmail = req.query.emailId || req.query.email;
    if (!rawEmail) {
      return res.status(400).json({
        success: false,
        message: 'emailId or email query parameter is required'
      });
    }

    const userEmail = rawEmail.trim().toLowerCase();
    const activityType = req.query.activityType || req.query.type || '';
    const search = (req.query.search || req.query.q || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

    const userDoc = await Activity.findOne({ userEmail }).lean();
    let activities = userDoc?.activities || [];

    // Filter by activity type
    if (activityType && activityType !== 'All Activities') {
      const typeMap = {
        'Flipbook Creation': 'create',
        'Flipbook Updation': 'edit_flip',
        'Flipbook Deletion': 'delete_flip',
        'Profile Creation': 'create_profile',
        'Profile Updation': 'edit',
        'Published Flipbook': 'publish',
        'Un-Published Flipbook': 'unpublish',
        create: 'create',
        edit_flip: 'edit_flip',
        delete_flip: 'delete_flip',
        create_profile: 'create_profile',
        edit: 'edit',
        publish: 'publish',
        unpublish: 'unpublish',
        send: 'send'
      };
      const mappedType = typeMap[activityType] || activityType;
      activities = activities.filter((item) => item.type === mappedType);
    }

    // Filter by search query
    if (search) {
      activities = activities.filter((item) => {
        const titleMatch = (item.title || '').toLowerCase().includes(search);
        const descMatch = (item.desc || '').toLowerCase().includes(search);
        const entityMatch = (item.entityName || '').toLowerCase().includes(search);
        return titleMatch || descMatch || entityMatch;
      });
    }

    // Sort newest first
    activities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalCount = activities.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = activities.slice(startIndex, startIndex + limit);

    // Format items with UI presentation tokens
    const formattedItems = paginatedItems.map((item) => {
      const createdDate = new Date(item.createdAt || Date.now());
      const styles = getTypeStyles(item.type);

      return {
        id: item._id ? item._id.toString() : String(Math.random()),
        _id: item._id ? item._id.toString() : String(Math.random()),
        type: item.type,
        title: item.title,
        desc: item.desc,
        entityId: item.entityId,
        entityName: item.entityName,
        time: getTimeLabel(createdDate),
        date: getDateLabel(createdDate),
        createdAt: item.createdAt,
        ...styles
      };
    });

    // Group items by date string in chronological order
    const groupsMap = new Map();
    formattedItems.forEach((item) => {
      const dateKey = item.date;
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey).push(item);
    });

    const groupedData = Array.from(groupsMap.entries()).map(([date, items]) => ({
      date,
      items
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      activities: groupedData,
      rawItems: formattedItems,
      totalCount,
      page,
      limit,
      totalPages,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching activities',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/activity/:id
 * @desc    Delete a specific activity item from user's activities array
 * @access  Public / Authenticated
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawEmail = req.query.emailId || req.query.email || req.body.emailId || req.body.email;

    if (!rawEmail) {
      // If email not provided in query, find document containing this activity id
      const updated = await Activity.findOneAndUpdate(
        { 'activities._id': id },
        { $pull: { activities: { _id: id } } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Activity deleted successfully',
        id
      });
    }

    const userEmail = rawEmail.trim().toLowerCase();
    const updated = await Activity.findOneAndUpdate(
      { userEmail },
      { $pull: { activities: { _id: id } } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Activity document not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting activity',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/activity/clear
 * @desc    Clear all activities for a user
 * @access  Public / Authenticated
 */
router.delete('/clear', async (req, res) => {
  try {
    const rawEmail = req.query.emailId || req.query.email || req.body.emailId || req.body.email;
    if (!rawEmail) {
      return res.status(400).json({
        success: false,
        message: 'emailId or email is required'
      });
    }

    const userEmail = rawEmail.trim().toLowerCase();
    await Activity.findOneAndUpdate(
      { userEmail },
      { $set: { activities: [] } }
    );

    return res.status(200).json({
      success: true,
      message: 'All activities cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while clearing activities',
      error: error.message
    });
  }
});

export default router;
