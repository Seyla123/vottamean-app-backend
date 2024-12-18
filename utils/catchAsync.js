// CatchAsync Function : Respsonse try catch errors
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
