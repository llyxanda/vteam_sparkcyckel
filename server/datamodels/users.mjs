import userSchema from './user.mjs';

const users = {
  getAllUsers: async function() {
    try {
      const users = await userSchema.find({});
      return users;
    } catch (e) {
      return {
        errors: {
          status: 500,
          source: "/getAllUsers",
          title: "Database error",
          detail: e.message
        }
      };
    }
  },

  getdataByEmail: async function(email) {
    try {
      const user = await userSchema.findOne({ email });
      return user;
    } catch (e) {
      return {
        errors: {
          status: 500,
          source: "/getUserByEmail",
          title: "Database error",
          detail: e.message
        }
      };
    }
  },

  // Update user balance
  updateBalance: async function (email, amount) {
    try {
      const user = await userSchema.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      const newAmount = user.amount + amount;
      if (newAmount < 0) {
        throw new Error('Not enough money on the account');
      }

      user.amount = newAmount;
      await user.save();

      return user;
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  },

  deleteAll: async function() {
    try {
      await userSchema.deleteMany({});
      console.log(`All users have been deleted.`);
    } catch (e) {
      console.error(e);
      throw new Error("An error occurred while deleting the users.");
    }
  },
};

export default users;
