export default function sessionMiddleware(req, res, next){
    if (typeof req.session.isOnline === "undefined") {
      req.session.isOnline = false;
    }
    next();
}