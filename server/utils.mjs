// Helper function to check if the user is an admin
const isAdmin = (context) => {
    if (!context.user || !context.user.admin) {
      throw new Error('Access denied: Admin only');
    }
    return true;
  };

export default isAdmin;