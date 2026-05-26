# Web 页面能力补全清单（对齐 `7dollar.delivery/account#charts`）

## 1. 目标
- 对齐网页端核心经营流程：`开台/点单/结账/打印/营收图表/门店设置`。
- 将当前项目从“可演示”提升到“可运营”状态。

## 2. 当前基线（已具备）
- 菜单管理 + AI 扫描（`app/(tabs)/menu`，`components/menu/tabs`）
- 座位点单与基础支付弹窗（`app/(tabs)/seats/[seatId].tsx`）
- 营收页面框架（订单列表 + 统计卡片，`app/(tabs)/revenue/index.tsx`）
- 设置页（门店、支付、二维码，`app/settings/*`）

## 3. 待补全（按优先级）

## P0（上线阻塞）
- [ ] **桌台生命周期闭环**
  - 开台（Start Table）
  - 计时与计费规则（Table Timing）
  - 结台（End Table）
  - 未结台拦截（Unfinished Tables Warning）
  - 主要改动点：`app/(tabs)/seats/index.tsx`、`app/(tabs)/seats/[seatId].tsx`、`components/seats/*`
  - 验收：能从开台到结台完整走通，异常情况下给出明确拦截提示。

- [ ] **支付闭环（真实支付状态）**
  - Payment Intent 创建/确认/失败回滚
  - 卡付/现金/分单一致状态机
  - 商户/顾客小票数据模型
  - 主要改动点：`components/seats/modals/PaymentModal.tsx`、`app/pickup/new.tsx`、`app/settings/payment.tsx`、后端接口
  - 验收：每笔支付有可追踪状态，失败可恢复，成功后订单状态正确。

- [ ] **打印闭环（后厨单/订单单/收据）**
  - Print Service 连接状态
  - Send to kitchen
  - Print order / Print receipt
  - 主要改动点：`app/(tabs)/seats/[seatId].tsx`、`backend_server/*`（或新增打印服务层）
  - 验收：打印按钮不再是 `Alert`，能触发真实打印任务并回传状态。

- [ ] **税费与金额规则完善**
  - Tax Exempt
  - Service Fee / Discount 规则统一
  - 金额计算与展示一致性（前后端同一规则）
  - 主要改动点：`components/seats/order/OrderSummary.tsx`、`app/(tabs)/seats/[seatId].tsx`、`app/(tabs)/revenue/*`
  - 验收：同一订单在各页面金额一致，可复算。

- [ ] **营收图表真实化**
  - `Cash Drawer` 与 `Sales Analysis` 从占位变真实图表/报表
  - 按日期、渠道、支付方式汇总
  - 主要改动点：`app/(tabs)/revenue/index.tsx`、`components/revenue/*`、`components/analytics/*`
  - 验收：图表数据可追溯到订单明细，筛选生效。

## P1（运营增强）
- [ ] **库存管理模块**
  - 库存变更、缺货告警、菜单库存联动
  - 主要改动点：新增 `inventory` 域模块（`app` + `components` + `types`）

- [ ] **员工与权限管理**
  - 员工账号、角色、权限粒度（收银/经理/管理员）
  - 主要改动点：新增 `staff` 模块，扩展 `context/auth.tsx`

- [ ] **菜单推荐与经营建议**
  - Menu Recommendations（销量/毛利/时间段）
  - 主要改动点：`components/menu/*`、`app/analytics/index.tsx`

## P2（稳定性与工程化）
- [ ] **通知系统事件化**
  - 从 mock 通知升级为真实事件流（支付、库存、系统告警）
  - 主要改动点：`app/(tabs)/notifications/index.tsx`、`components/notifications/*`

- [ ] **埋点与日志**
  - 关键操作埋点、错误追踪、支付日志审计

- [ ] **自动化测试补齐**
  - 金额计算、支付状态机、结台流程、打印任务

## 4. 建议实施顺序（两周冲刺版）
- 第 1 阶段：桌台生命周期 + 税费规则
- 第 2 阶段：支付闭环 + 打印闭环
- 第 3 阶段：营收图表真实化 + 通知事件化
- 第 4 阶段：库存/员工模块

## 5. 风险与依赖
- 支付与打印依赖外部服务/设备，需先确定接口协议。
- 税费与折扣规则若不先统一，会导致前后端金额不一致。
- 建议先冻结订单数据模型，再并行开发前端页面。

## 6. 线上实测补充（2026-03-14，Playwright）
- 测试账号：游客（`Guest@7dollar.delivery`，使用 `ONE TIME SIGN IN`）。
- 已创建测试店：`codex_test_1773468266465`，店铺 ID：`aapp-sf-94105-503`。
- 证据文件：
  - `C:/Users/yeeku/AppData/Local/Temp/pw_probe_7dollar/store-aapp-sf-94105-503-route-scan-v2.json`
  - `C:/Users/yeeku/AppData/Local/Temp/pw_probe_7dollar/store-aapp-sf-94105-503-*-v2.png`

### 6.1 游客态可见功能（已验证）
- 账户壳层：`Account`、`Hide Side Bar`、`Create Store`、`Sign Out`。
- 顶栏能力：语言切换（`Select Language`）、打印状态提示（`Printer not connected`）。
- 创建门店表单：`Store Display Name`、`Tax Rate`、`Zip Code`、`Auto Fill Address` 等字段可见。

### 6.2 游客态受限/异常（已验证）
- 访问 `#charts/#book/#code/#cards/#settings/#person` 时，页面均回落到账户壳层，未展示业务模块内容。
- 控制台连续出现 `Store not found in storelist`，说明游客态下店铺上下文未正常绑定到业务路由。
- 存在运行时错误：`Cannot read properties of null (reading 'sort')`。

### 6.3 对齐结论（针对当前项目）
- 当前“待补全清单”中的 P0/P1/P2 依然有效，不需要下调优先级。
- 游客会话下已可覆盖核心菜单链路；若要继续核查“员工权限、支付实扣、设备绑定”等高权限能力，仍需要非游客角色账号（店主/管理员）。

## 7. 模块级差异（2026-03-14 二次实测，游客建店后）
- 本轮在同一会话创建门店：`codex_probe_1773469255552`，店铺 Hash：`#aapp-sf-94105-659`。
- 证据文件：
  - `C:/Users/yeeku/AppData/Local/Temp/pw_probe_7dollar/guest-create-and-menu-scan-v2.json`
  - `C:/Users/yeeku/AppData/Local/Temp/pw_probe_7dollar/guest-v2-menu-*.png`

### 7.1 Web 端已存在的核心功能（已验证）
- **Daily Revenue（`#charts`）**
  - 日期范围筛选（Start/End Date）
  - 月份筛选
  - 订单维度切换：`Today's / Yesterday / March / February`
  - 视图切换：`List All Orders / Cash Drawer / Sales Analytics`
  - 过滤项：Dining Table Type、Payment Type
  - 图表入口：`View Data Chart`
- **Dine In Ordering（`#code`）**
  - 桌台平面图（示例 A1/A2/A3）
  - 桌台状态图例（空桌/占用等）
  - `Admin Mode` 入口
- **Notification（`#cards`）**
  - 订单通知列表（Order ID / Dining Table / Time）
  - `Add Test Notification`（测试消息注入）
- **Menu Settings（`#book`）**
  - 菜单分类与搜索
  - 菜品卡片编辑（价格、分类、可售状态、推荐）
  - 语言字段（中/英）
  - `Scan Menu`、`Save Changes`、全局改动入口
  - 与“开台功能”相关的菜单规则提示
- **Store Settings（`#settings`）**
  - 店铺基础信息与税率
  - 门店链接与二维码打印
  - 重置密码
  - Stripe 连接入口
  - 营业时间维护（含 Submit）

### 7.2 当前项目相对 Web 端的明确缺口（建议优先补齐）
- **营收模块缺口（高优先）**
  - 缺少 Web 端同级别的日期/月份/支付方式/桌型筛选闭环。
  - 缺少 `Cash Drawer` 与 `Sales Analytics` 的真实切换与数据面板。
  - 缺少 “图表入口 + 明细联动” 的完整交互链路。
- **Dine-in 桌台模块缺口（高优先）**
  - 缺少可视化桌台平面图编辑/渲染能力（仅列表或基础态不足以对齐）。
  - 缺少桌台状态图例与管理态（Admin Mode）对应能力。
- **通知模块缺口（中高优先）**
  - 缺少可操作测试注入能力（便于联调与演示）。
  - 缺少按订单维度展示通知列表的完整字段对齐。
- **菜单模块缺口（中高优先）**
  - 缺少分类重命名/批量全局更新等运营动作。
  - 缺少中英双语字段运营流程与推荐位规则的完整配置闭环。
- **门店设置缺口（中优先）**
  - 缺少营业时间完整维护流与提交闭环。
  - 缺少门店链接/二维码打印、Stripe 连接等运营工具入口的一致性。
