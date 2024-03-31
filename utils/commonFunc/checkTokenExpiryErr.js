const checkTokenExpiryErr = (error) => {
  if (error.name === "TokenExpiredError") {
    return {
      success: false,
      msg: "Token expired.",
    };
  }
};

module.exports = { checkTokenExpiryErr };
