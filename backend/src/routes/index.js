const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const auth = require('./auth');
const ships = require('../controllers/ships');
const users = require('../controllers/users');
const tasks = require('../controllers/tasks');
const drills = require('../controllers/drills');
const dashboard = require('../controllers/dashboard');

router.use('/auth', auth);

router.get('/ships', requireAuth, ships.list);
router.post('/ships', requireAuth, requireRole('admin'), ships.create);
router.get('/ships/:id', requireAuth, ships.getOne);
router.patch('/ships/:id', requireAuth, requireRole('admin'), ships.update);

router.get('/users', requireAuth, requireRole('admin'), users.list);
router.post('/users', requireAuth, requireRole('admin'), users.create);
router.get('/users/:id', requireAuth, requireRole('admin'), users.getOne);
router.patch('/users/:id', requireAuth, requireRole('admin'), users.update);

router.get('/tasks', requireAuth, tasks.list);
router.post('/tasks', requireAuth, requireRole('admin'), tasks.create);
router.get('/tasks/:id', requireAuth, tasks.getOne);
router.patch('/tasks/:id', requireAuth, requireRole('admin'), tasks.update);
router.delete('/tasks/:id', requireAuth, requireRole('admin'), tasks.remove);
router.patch('/tasks/:id/status', requireAuth, tasks.updateStatus);
router.post('/tasks/:id/comments', requireAuth, tasks.addComment);

router.get('/drills', requireAuth, drills.list);
router.post('/drills', requireAuth, requireRole('admin'), drills.create);
router.get('/drills/:id', requireAuth, drills.getOne);
router.patch('/drills/:id/complete', requireAuth, requireRole('admin'), drills.complete);
router.delete('/drills/:id', requireAuth, requireRole('admin'), drills.remove);
router.post('/drills/:id/attendance', requireAuth, drills.markAttendance);

router.get('/compliance/fleet', requireAuth, requireRole('admin'), dashboard.adminOverview);
router.get('/compliance/ship/:id', requireAuth, dashboard.shipOverview);
router.get('/compliance/crew', requireAuth, requireRole('crew'), dashboard.crewOverview);

module.exports = router;
