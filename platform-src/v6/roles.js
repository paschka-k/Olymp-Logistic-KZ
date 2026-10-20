/* Roles & permissions (FR-14/137): 11 roles, permission matrix generated from the source platform (role-perms.json),
   screen / tab gating, role shells (driver, customer, partner use their own menu), role switcher. */
const VERSION = '6.3.0', BUILD = '@@BUILD@@';
const ROLES = ['admin', 'dispatcher', 'warehouse', 'driver', 'auditor', 'viewer', 'manager', 'finance', 'quality', 'customer', 'partner'];
const ROLE_NAME = {
  admin: LT('role.administrator'), dispatcher: LT('role.dispatcher'), warehouse: LT('role.warehouse'),
  driver: LT('role.driver'), auditor: LT('role.auditor'), viewer: LT('role.viewer'),
  manager: LT('role.management'), finance: LT('role.finance'), quality: LT('role.quality'),
  customer: LT('role.customer_portal'), partner: LT('role.partner_portal'),
};
const ROLE_PERMS = /*@@ROLEPERMS@@*/{};
const SCREEN_PERM = { dashboard: 'overview:read', orders: 'orders:read', dispatch: 'trips:read', fleet: 'fleet:read', drivers: 'drivers:read', routes: 'trips:read', hubs: 'trips:read', pod: 'trips:read', billing: 'costs:read', reports: 'overview:read', ai: 'overview:read', settings: 'overview:read', baseline: 'costs:read' };
const SHELL_NAV = { driver: [], customer: [], partner: [] };   // role shells: [id, icon, label, phase] pushed by the driver-app / portal areas
const ALWAYS = ['help', 'changes', 'track', 'request'];   // track / request: public views (W4)
const canDo = p => (ROLE_PERMS[S.role] || []).includes(p);
const canSee = id => ALWAYS.includes(id) || (SHELL_NAV[S.role] ? SHELL_NAV[S.role].some(n => n[0] === id) : canDo(SCREEN_PERM[id] || 'overview:read'));
const HELP_NAV = ['help', 'spark', LT('role.help'), 0];
const navItems = () => (SHELL_NAV[S.role] ? SHELL_NAV[S.role].concat([HELP_NAV]) : NAV.filter(n => canSee(n[0])));
const homeRoute = () => navItems()[0][0];
Object.assign(ACT, { setRole: d => { S.role = d.v; if (!canSee(S.route)) S.route = homeRoute(); S.drawer = null; render(); }, setDesign: () => { S.design = S.design === 'olymp' ? 'kokzhol' : 'olymp'; document.documentElement.dataset.design = S.design; render(); } });
registerAction('setRole', { area: 'roles', audit: { module: 'Roles', subject: d => d.v, watch: () => S.role, decision: () => LT('actions.role_switched') } });
document.addEventListener('change', e => { if (e.target.id === 'roleSel') ACT.setRole({ v: e.target.value }); });
