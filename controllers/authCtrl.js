const authCtrl = {
  register: async (req, res) => {
    const userData = req.body;
    if (userData) {
      res
        .status(200)
        .json({ success: true, msg: "got request", user: userData });
    } else {
      res.status(400).json({ success: false, msg: "no data provided" });
    }
  },
};

module.exports = authCtrl;
