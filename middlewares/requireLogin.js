export default function requireLogin(req, res, next) {
    if (req.session.isOnline) {
        next()
    } else {
        res.status(401).send('You need to log in first')
    }
}