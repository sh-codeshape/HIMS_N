"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modulesRoutes = void 0;
const express_1 = require("express");
const modules_controller_1 = require("./modules.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
const controller = new modules_controller_1.ModulesController();
router.use(authenticate_1.authenticate);
// Any authenticated user can view which modules are enabled
router.get('/', authenticate_1.authenticate, controller.getModules);
// Only developer.modules can toggle modules
router.put('/:moduleKey', authenticate_1.authenticate, (0, authorize_1.authorize)(['developer.modules']), controller.toggleModule);
exports.modulesRoutes = router;
