const en_part4 = {
  mobileApp: {
    pageTitle: 'Mobile apps',
    pageSubtitle: 'Upload and manage your mobile apps — share them with your team via download link or QR code',
    tipLabel: 'Tip:',
    tipText: 'Upload APK files here, then share them with drivers and salespeople via the download link or QR code.',
    compatNote: 'Compatible with Android 8.0 and later — installation from external sources must be allowed',
    driverName: 'Driver app',
    sellerName: 'Sales app',
    cashvanName: 'CashVan app',
    driverDesc: 'Delivery, order tracking and payment app — works offline',
    sellerDesc: 'Mobile sales, route and client management — sell from anywhere',
    cashvanDesc: 'Direct sales and delivery from the vehicle — instant cash collection in the field',
    drvFeat1: 'Pick up and deliver orders',
    drvFeat2: 'Live location tracking',
    drvFeat3: 'Collect payments',
    drvFeat4: 'Handle returns',
    drvFeat5: 'Works offline',
    drvFeat6: 'Instant notifications',
    selFeat1: 'Create field orders',
    selFeat2: 'Manage routes and clients',
    selFeat3: 'Sell from the mobile warehouse',
    selFeat4: 'Per-client pricing',
    selFeat5: 'Product catalogue',
    selFeat6: 'Daily sales reports',
    cvFeat1: 'Direct sales from the van',
    cvFeat2: 'Instant cash collection',
    cvFeat3: 'Van stock management',
    cvFeat4: 'Daily client routes',
    cvFeat5: 'Bluetooth invoice printing',
    cvFeat6: 'Works offline',
    notUploaded: 'Not uploaded yet',
    notUploadedYet: 'No APK uploaded yet',
    qrLabel: 'Scan code to download',
    qrHint: 'Point your phone camera at the code to start the download',
    downloadBtn: 'Download app ({size})',
    copyLink: 'Copy link',
    copied: 'Copied!',
    whatsapp: 'WhatsApp',
    updateApp: 'Update app',
    uploadApk: 'Upload APK',
    uploadModalTitle: 'Upload {name}',
    uploadModalSubtitle: 'Pick an APK file and enter the version number',
    fileField: 'APK file',
    pickFile: 'Click to pick an APK file',
    versionField: 'Version number',
    versionPlaceholder: 'e.g. 1.0.0',
    uploadingProgress: 'Uploading…',
    uploading: 'Uploading…',
    upload: 'Upload',
    cancel: 'Cancel',
    pickFileFirst: 'Please pick a file and enter a version number',
    apkOnly: 'Please pick an APK file',
    uploadSuccess: 'App uploaded successfully',
    uploadError: 'Error during upload',
    linkCopied: 'Link copied',
    confirmDelete: 'Are you sure you want to delete {name}?',
    deleteSuccess: 'App deleted successfully',
    deleteError: 'Error during deletion',
    waMessage: '📲 Download {name} here:\n{url}',
  },
  reports: {
    // Header
    title: 'Reports',
    subtitle: 'Complete analysis of payments and financial operations',
    from: 'From:',
    to: 'To:',

    // Tabs
    tabPurchases: 'Purchases',
    tabSales: 'Sales',
    tabSaleReturns: 'Sale returns',
    tabPurchaseReturns: 'Purchase returns',

    // KPIs — Purchases
    kpiTotalPurchases: 'Total purchases',
    kpiTotalAmount: 'Total amount',
    kpiPaidAmount: 'Paid amount',
    kpiDueAmount: 'Due amount',
    // KPIs — Sales
    kpiTotalSales: 'Total sales',
    // KPIs — Returns
    kpiTotalSaleReturns: 'Total sale returns',
    kpiTotalPurchaseReturns: 'Total purchase returns',
    kpiTotalReturnAmount: 'Returns amount',

    // Charts — Purchases
    chartTopSuppliers: 'Top 10 suppliers by amount',
    chartDailyTrend: 'Daily purchase trend',
    // Charts — Sales
    chartTopClients: 'Top 10 clients by amount',
    chartDailySalesTrend: 'Daily sales trend',
    // Charts — Sale Returns
    chartTopReturnClients: 'Top clients by returns',
    chartDailyReturnTrend: 'Daily sale return trend',
    // Charts — Purchase Returns
    chartTopReturnSuppliers: 'Top suppliers by returns',
    chartDailyPurchaseReturnTrend: 'Daily purchase return trend',

    // Table
    tableTitle: 'Purchases list',
    tableTitleSales: 'Sales list',
    tableTitleSaleReturns: 'Sale returns list',
    tableTitlePurchaseReturns: 'Purchase returns list',
    entries: 'entries',

    // Columns
    colReference: 'Reference',
    colSupplier: 'Supplier',
    colClient: 'Client',
    colUser: 'User',
    colWarehouse: 'Warehouse',
    colDate: 'Date',
    colTotal: 'Total',
    colPaid: 'Paid',
    colDue: 'Due',
    colAmount: 'Amount',
    colStatus: 'Status',
    colPaymentStatus: 'Payment status',
    colSaleRef: 'Sale ref.',
    colPurchaseRef: 'Purchase ref.',

    // Status badges
    statusPending: 'Pending',
    statusReceived: 'Received',
    statusPartial: 'Partial',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    payUnpaid: 'Unpaid',
    payPartial: 'Partially paid',
    payPaid: 'Paid',

    // Pagination
    pageInfo: 'Page {current} of {total} — {count} entries',
    prev: 'Previous',
    next: 'Next',

    // Export
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',

    // Filters
    filters: 'Filters',
    filterAll: 'All',
    filterSearchRef: 'Search by ref...',
    filterSearchSupplier: 'Search by supplier...',
    clearFilters: 'Clear filters',

    // General
    noData: 'No data',
  },

  employeesPage: {
    // Page header
    pageTitle: 'Employees',
    addEmployee: 'Add employee',

    // Shortcuts
    shortcutsLabel: 'Shortcuts:',
    shortcutAddNew: 'New',
    shortcutHint: 'Insert or Alt+N',

    // Search
    searchPlaceholder: 'Search...',

    // Table headers
    thName: 'Name',
    thPhone: 'Phone',
    thPosition: 'Position',
    thSalary: 'Salary',
    thHireDate: 'Hire date',
    thTotalDispenses: 'Total expenses',
    thStatus: 'Status',
    thActions: 'Actions',

    // Status
    statusActive: 'Active',
    statusInactive: 'Inactive',

    // Empty state
    noEmployees: 'No employees found',

    // Modal
    modalTitleAdd: 'Add new employee',
    modalTitleEdit: 'Edit employee',

    // Form labels
    labelName: 'Name',
    labelPhone: 'Phone',
    labelPosition: 'Position',
    labelSalary: 'Salary',
    labelHireDate: 'Hire date',
    labelNotes: 'Notes',
    labelActiveEmployee: 'Active employee',
    required: '*',

    // Buttons
    saving: 'Saving...',
    update: 'Update',
    add: 'Add',
    cancel: 'Cancel',

    // Toast messages
    toastLoadError: 'Error loading employees',
    toastNameRequired: 'Please enter the employee name',
    toastUpdateSuccess: 'Employee updated successfully',
    toastCreateSuccess: 'Employee added successfully',
    toastSaveError: 'Error while saving',
    toastDeleteSuccess: 'Employee deleted',
    toastDeleteError: 'Error while deleting',
    toastStatusError: 'Error updating status',

    // Confirm dialog
    confirmDelete: 'Are you sure you want to delete this employee?',
  },

  users: {
    // Page header
    pageTitle: 'Users',
    pageSubtitle: 'Manage system users',
    addUser: 'Add user',

    // Shortcuts
    shortcutsLabel: 'Shortcuts:',
    shortcutAddNew: 'New',

    // Search
    searchPlaceholder: 'Search a user...',

    // Table headers
    thName: 'Name',
    thEmail: 'Email',
    thPhone: 'Phone',
    thRole: 'Role',
    thWarehouse: 'Warehouse',
    thStatus: 'Status',
    thActions: 'Actions',

    // Role labels
    roleAdmin: 'Administrator',
    roleManager: 'Manager',
    roleSeller: 'Salesperson',
    roleLivreur: 'Delivery driver',
    roleCashvan: 'Cashvan salesperson',

    // Plan labels
    planFree: 'Free',
    planStarter: 'Starter',
    planPro: 'Pro',
    planBusiness: 'Business',

    // Status labels
    statusActive: 'Active',
    statusInactive: 'Inactive',

    // Filter
    allRoles: 'All roles',

    // Modal titles
    modalAdd: 'Add user',
    modalEdit: 'Edit user',

    // Form labels
    labelName: 'Name',
    labelEmail: 'Email',
    labelPassword: 'Password',
    labelPhone: 'Phone',
    labelRole: 'Role',
    labelWarehouse: 'Warehouse',
    labelActiveUser: 'Active user',
    usernamePlaceholder: 'Username',
    noWarehouse: '-- No warehouse --',

    // Create warehouse checkbox
    createWarehouseCashvan: 'Create a dedicated warehouse for the cashvan salesperson',
    createWarehouseLivreur: 'Create a dedicated warehouse for the driver',
    createWarehouseHint: 'A warehouse will be created automatically in the user\'s name',

    // Buttons
    cancel: 'Cancel',
    update: 'Update',
    add: 'Add',
    close: 'Close',

    // Password reset modal
    resetPasswordTitle: 'Change password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    changePassword: 'Change',

    // Delete confirmation
    deleteTitle: 'Delete user',
    deleteConfirm: 'Are you sure you want to delete "{name}"?',

    // Caisse balance warning
    caisseWarningTitle: 'Warning: cash drawer has a balance',
    caisseMustEmpty: 'The cash drawer must be emptied first',
    caisseBalanceMsg: 'User "{name}" has a cash drawer balance of',
    transferAndDelete: 'Transfer the balance to the main cash drawer and delete',

    // User limit modal
    limitTitle: 'User limit reached',
    limitUsersCount: 'users — {plan} plan limit',
    limitExtraPrice: 'You can add extra users for {price} DA/user/month',
    limitUpgrade: 'Or upgrade your plan:',
    limitUpTo: 'Up to {limit} users',
    limitPriceMonth: '{price} DA/month',
    limitFree: 'Free',

    // Toast messages
    toastCreateSuccess: 'User added successfully',
    toastCreateError: 'Error while adding',
    toastUpdateSuccess: 'User updated successfully',
    toastUpdateError: 'Error while updating',
    toastDeleteSuccess: 'User deleted successfully',
    toastDeleteError: 'Error while deleting',
    toastPasswordSuccess: 'Password changed successfully',
    toastPasswordError: 'Error while changing password',
    toastStatusSuccess: 'User status updated',
    toastStatusError: 'An error occurred',

    // Empty state
    emptyMessage: 'No users',

    // Invite modal
    inviteUser: 'Invite user',
    inviteDirect: 'Direct credentials',
    inviteMagicLink: 'Magic link',
    identifier: 'Email or phone',
    passwordForUser: 'Password',
    role: 'Role',
    copyAcceptUrl: 'Copy accept URL',
    inviteSent: 'Invitation sent successfully',
    userCreated: 'User created successfully',
    sendInvite: 'Send invite',
    createUser: 'Create user',
    inviteEmailLabel: 'Email',
    inviteIdentifierHint: 'Email or phone number',
  },
  roles: {
    title: 'Roles',
    subtitle: 'Manage roles and permissions',
    searchPlaceholder: 'Search roles...',
    addRole: 'Add role',
    editRole: 'Edit role',
    deleteRole: 'Delete role',
    system: 'System role',
    usersCount: 'Users',
    permissionsCount: 'Permissions',
    name: 'Role name',
    description: 'Description',
    module: 'Module',
    allInRow: 'All',
    deleteSystemError: 'System roles cannot be deleted',
    deleteAssignedError: 'Cannot delete a role assigned to users',
    savedSuccess: 'Role saved successfully',
    createdSuccess: 'Role created successfully',
    deletedSuccess: 'Role deleted successfully',
    confirmDelete: 'Are you sure you want to delete this role?',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    create: 'Create',
    empty: 'No roles',
    backToRoles: 'Back to roles',
    readOnlyNotice: 'Read-only system role',
  },
  acceptInvite: {
    title: 'Set up your account',
    subtitle: 'Choose a password to activate your account',
    passwordLabel: 'Password',
    confirmLabel: 'Confirm password',
    button: 'Activate account',
    activating: 'Activating...',
    successMessage: 'Account activated successfully. Sign in now.',
    invalidLink: 'Invalid or expired invitation link',
    backToLogin: 'Back to login',
  },
  orders: {
    // Page header
    title: 'Orders',
    subtitle: 'Manage and validate client orders',
    tourButton: 'Guided tour',
    // KPI labels
    totalOrders: 'Total orders',
    todayOrders: 'Today\'s orders',
    totalAmounts: 'Total amount',
    problems: 'Issues',
    pendingToday: '{count} pending',
    // Status labels
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusAssigned: 'Assigned',
    statusDelivered: 'Delivered',
    statusPartial: 'Partial delivery',
    statusCancelled: 'Cancelled',
    // Search & filter
    searchPlaceholder: 'Search by reference or client name...',
    filterButton: 'Filter',
    clearButton: 'Clear',
    // Filter labels
    filterStatus: 'Status',
    filterSeller: 'Salesperson',
    filterClient: 'Client',
    filterDateFrom: 'Start date',
    filterDateTo: 'End date',
    filterProblemsOnly: 'Issues only',
    allStatuses: 'All statuses',
    allSellers: 'All salespeople',
    allClients: 'All clients',
    // Status chips
    chipAll: 'All',
    chipPending: 'Pending',
    chipConfirmed: 'Confirmed',
    chipAssigned: 'Assigned',
    chipDelivered: 'Delivered',
    chipPartial: 'Partial',
    chipCancelled: 'Cancelled',
    // Empty state
    noOrders: 'No orders',
    noOrdersDesc: 'No orders found with these criteria',
    // New order
    newOrder: 'New order',
    createNewOrder: 'Create an order',
    // Detail labels
    detailClient: 'Client',
    detailSeller: 'Salesperson',
    detailWarehouse: 'Warehouse',
    detailTotal: 'Total',
    // Stock warnings
    allStockAvailable: 'All quantities are available in stock',
    insufficientStock: 'Insufficient stock for some products',
    stockAvailable: 'Available:',
    stockNeeded: 'Required:',
    // Create purchase
    createPurchaseButton: 'Create a purchase invoice for the missing quantities',
    purchaseNoteTemplate: 'Purchase for order {reference}',
    // Table headers
    thProduct: 'Product',
    thQuantityOrdered: 'Quantity ordered',
    thAvailable: 'Available',
    thConfirmedQty: 'Confirmed quantity',
    thConfirmed: 'Confirmed',
    thDelivered: 'Delivered',
    thPrice: 'Price',
    thTotal: 'Total',
    // Quantity units
    unitCarton: 'carton',
    unitPiece: 'piece',
    unitUnit: 'unit',
    // Confirm/Cancel
    confirmOrder: 'Confirm order',
    cancelButton: 'Cancel',
    // Notes
    notesLabel: 'Notes',
    // Problem
    problemLabel: 'Issue',
    // Pagination
    totalXOrders: 'Total {total} orders',
    pageXOfY: 'Page {current} of {last}',
    previous: 'Previous',
    next: 'Next',
    orderCount: '{count} orders',
    // Cancel dialog
    cancelDialogTitle: 'Cancel order',
    cancelDialogMessage: 'Are you sure you want to cancel order "{reference}"?',
    cancelDialogConfirm: 'Cancel order',
    // Toast messages
    toastOrderCancelled: 'Order cancelled',
    toastCancelError: 'Error while cancelling',
    toastConfirmSuccess: 'Order confirmed successfully',
    toastConfirmError: 'Error while confirming',
    toastDetailLoadError: 'Error loading details',
    // Other
    returned: 'Returned:',
    refreshButton: 'Refresh',
    loadingDetails: 'Loading details...',
    viewDetails: 'View details',
    // Tour steps
    tourTitle1: 'Order management',
    tourDesc1: 'Manage all client orders. View pending orders, adjust quantities, and confirm or cancel.',
    tourTitle2: 'Stats summary',
    tourDesc2: 'Quick view of total orders, today\'s orders, amounts and issues.',
    tourTitle3: 'Search and filter',
    tourDesc3: 'Search by reference or client name. Use advanced filters to narrow by status, salesperson, client or date.',
    tourTitle4: 'Status filters',
    tourDesc4: 'Quick filtering by order status. Click a status to see the matching orders.',
    tourTitle5: 'Order cards',
    tourDesc5: 'Each order is shown on a card. Click to view products. Adjust quantities and confirm directly for pending orders.',
  },
  settings: {
    // Page
    title: 'Settings',
    // Tabs
    tabCompany: 'Company',
    tabLegal: 'Legal information',
    tabGeneral: 'General',
    tabInvoice: 'Invoices',
    tabAppearance: 'Appearance',
    tabSecurity: 'Security',
    tabBackup: 'Backup',
    // Dark mode toggle
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    // Save
    saveSettings: 'Save settings',
    saving: 'Saving...',
    saveSuccess: 'Settings saved successfully',
    saveError: 'Error while saving settings',
    // Password gate
    settingsProtected: 'Settings protected',
    enterPasswordAccess: 'Please enter the password to access settings',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password...',
    verifying: 'Verifying...',
    enter: 'Enter',
    pleaseEnterPassword: 'Please enter the password',
    verifiedSuccess: 'Verified successfully',
    wrongPassword: 'Wrong password',
    // Company tab
    companyInfo: 'Company information',
    companyLogo: 'Company logo',
    uploadLogo: 'Upload logo',
    deleteLogo: 'Delete',
    logoMaxSize: 'Max size: 2 MB. PNG, JPG, GIF',
    logoUploadSuccess: 'Logo uploaded successfully',
    logoUploadError: 'Error while uploading logo',
    logoDeleteSuccess: 'Logo deleted',
    logoDeleteError: 'Error while deleting logo',
    companyName: 'Company name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    // Legal tab
    legalInfo: 'Legal information (for invoices)',
    legalInfoDesc: 'This information will appear on all invoices',
    rc: 'RC (Trade Register)',
    nif: 'NIF (Tax Identification Number)',
    ai: 'AI (Tax Article)',
    nis: 'NIS (Statistical Identification Number)',
    rib: 'RIB (Bank Account Number)',
    // General tab
    generalSettings: 'General settings',
    currency: 'Currency',
    currencyDZD: 'Algerian Dinar (DZD)',
    currencyUSD: 'US Dollar (USD)',
    currencyEUR: 'Euro (EUR)',
    taxRate: 'Default tax rate (%)',
    lowStockAlert: 'Low stock alert (minimum threshold)',
    autoValidateOrders: 'Automatic order validation',
    autoValidateDesc: 'Should orders be validated automatically when created by the salesperson?',
    manualApproval: 'Manual — approval required',
    manualApprovalDesc: 'The order stays pending until the manager approves it',
    autoApproval: 'Automatic — instant validation',
    autoApprovalDesc: 'The order is validated automatically as soon as it is created',
    sellerVisibility: 'Client visibility for salespeople',
    sellerVisibilityDesc: 'Can a salesperson see clients belonging to other salespeople in the app?',
    ownClientsOnly: 'Own clients only',
    ownClientsOnlyDesc: 'Each salesperson only sees the clients they added',
    allClients: 'All clients',
    allClientsDesc: 'Salespeople see all clients',
    new: 'New',
    // Invoice tab
    invoiceSettings: 'Invoice settings',
    salesInvoicePrefix: 'Sales invoice prefix',
    purchaseInvoicePrefix: 'Purchase invoice prefix',
    showLogoOnInvoice: 'Show logo on invoices',
    showCompanyOnInvoice: 'Show company information on invoices',
    // Appearance tab
    appearance: 'Appearance',
    chooseTheme: 'Choose theme',
    // Security tab
    securitySettings: 'Security settings',
    securityDesc: 'Protect the settings page with a password. Once enabled, the password will be required to access settings.',
    protectionEnabled: 'Protection enabled',
    protectionDisabled: 'Protection disabled',
    protectionEnabledDesc: 'The settings page is protected by a password',
    protectionDisabledDesc: 'Any user can access settings',
    currentPassword: 'Current password',
    currentPasswordPlaceholder: 'Enter current password',
    newPassword: 'New password',
    setPassword: 'Password',
    newPasswordPlaceholder: 'Enter password',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Re-enter password',
    updatePassword: 'Change password',
    enableProtection: 'Enable protection',
    removeProtection: 'Remove protection',
    passwordMismatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 4 characters',
    passwordUpdateSuccess: 'Password updated successfully',
    passwordUpdateError: 'Error while updating password',
    enterCurrentPassword: 'Please enter the current password',
    confirmRemoveProtection: 'Are you sure you want to remove password protection?',
    passwordRemovedSuccess: 'Password removed',
    // Backup tab
    backupAndRestore: 'Backup and restore',
    backupDesc: 'Create an encrypted backup of all system data, or restore a previous backup. The backup is encrypted and can only be read by this system.',
    createBackup: 'Create a backup',
    createBackupDesc: 'Download an encrypted file containing all data',
    creatingBackup: 'Creating backup...',
    createAndDownloadBackup: 'Create and download a backup',
    backupSuccess: 'Backup created successfully',
    backupError: 'Error while creating backup',
    exportSql: 'Export SQL',
    exportSqlDesc: 'Download a SQL file that can be imported into any MySQL database',
    exportingSql: 'Exporting...',
    exportSqlButton: 'Export SQL database',
    exportSqlSuccess: 'Database exported successfully',
    exportSqlError: 'Error while exporting database',
    restoreBackup: 'Restore a backup',
    restoreBackupDesc: 'Upload a .rbk file to restore data',
    restoreWarning: 'Warning: restoring a backup will delete all current data and replace it with the backup data. This action is irreversible.',
    restoring: 'Restoring...',
    selectBackupFile: 'Select backup file',
    invalidFileFormat: 'Please select a .rbk file',
    readingBackupInfo: 'Reading backup information...',
    invalidFile: 'Invalid file',
    restoringBackup: 'Restoring backup...',
    restoreSuccess: 'Backup restored successfully',
    restoreFailed: 'Backup restore failed',
    confirmRestore: 'Confirm restore',
    backupDate: 'Backup date:',
    createdBy: 'Created by:',
    version: 'Version:',
    tablesCount: 'Number of tables:',
    confirmRestoreWarning: 'All current data will be deleted and replaced. Are you sure?',
    cancel: 'Cancel',
    confirmRestoreButton: 'Confirm restore',
  },

  mobileAppPage: {
    // Page header
    title: 'Mobile apps',
    subtitle: 'Download apps and share them with your team — via link or QR code',

    // No apps state
    noAppsTitle: 'No app available',
    noAppsDesc: 'No mobile app is included in your current subscription. Contact support for more information.',

    // Tip banner
    tipLabel: 'Tip:',
    tipText: 'Open this page on your phone for a direct download, or scan the QR code from the driver\'s/salesperson\'s phone to install the app instantly.',

    // App names
    driverAppName: 'Driver app',
    sellerAppName: 'Salesperson app',
    cashvanAppName: 'CashVan app',

    // App descriptions
    driverAppDesc: 'Delivery, order tracking and cash collection app for drivers — works offline',
    sellerAppDesc: 'Mobile sales app for managing routes and clients — sell from anywhere',
    cashvanAppDesc: 'Direct sales and delivery from the truck — instant sale with on-the-spot collection',

    // Driver features
    driverFeature1: 'Receive and deliver orders',
    driverFeature2: 'Real-time location tracking',
    driverFeature3: 'Collect payments',
    driverFeature4: 'Manage returns',
    driverFeature5: 'Works offline',
    driverFeature6: 'Instant notifications',

    // Seller features
    sellerFeature1: 'Create orders in the field',
    sellerFeature2: 'Route and client management',
    sellerFeature3: 'Sell from mobile warehouse',
    sellerFeature4: 'Custom client pricing',
    sellerFeature5: 'Product catalog',
    sellerFeature6: 'Daily sales reports',

    // Cashvan features
    cashvanFeature1: 'Direct sales from the truck',
    cashvanFeature2: 'Instant cash collection',
    cashvanFeature3: 'Truck stock management',
    cashvanFeature4: 'Daily client routes',
    cashvanFeature5: 'Bluetooth invoice printing',
    cashvanFeature6: 'Works offline',

    // QR section
    scanToDownload: 'Scan to download',
    scanInstruction: 'Point your phone camera at the code to start the download',

    // Buttons
    downloadApp: 'Download app',
    copyLink: 'Copy link',
    copied: 'Copied!',
    linkCopiedToast: 'Link copied',
    shareWhatsApp: 'Share on WhatsApp',
    whatsAppMessage: 'Download {appName} here:',

    // Bottom note
    compatibilityNote: 'Apps compatible with Android 8.0 and later — installation from external sources must be allowed',
  },

  // TRANSACTIONS_REPORT_KEYS
  transactions: {
    title: 'Transactions report',
    subtitle: 'Detailed analysis of all payments and collections',
    // KPIs
    kpiTotalTransactions: 'Total transactions',
    kpiTotalAmount: 'Total amount',
    kpiCashPayments: 'Cash payments',
    kpiBankCheck: 'Bank & checks',
    // Charts
    chartTopEntities: 'Top 10 entities by amount',
    chartDailyTrend: 'Daily payment trend',
    // Table
    tableTitle: 'Transactions list',
    colReference: 'Reference',
    colType: 'Type',
    colEntity: 'Entity',
    colAmount: 'Amount',
    colMethod: 'Method',
    colDate: 'Date',
    colUser: 'User',
    // Method labels
    methodCash: 'Cash',
    methodBank: 'Bank',
    methodCheck: 'Check',
    methodOther: 'Other',
    // Type labels
    typeSale: 'Sale',
    typePurchase: 'Purchase',
    // Filters
    filterSearchRef: 'Search by reference...',
    filterMethod: 'Payment method',
    filterType: 'Operation type',
    filterAll: 'All',
    // Common
    from: 'From:',
    to: 'To:',
    noData: 'No data',
    entries: 'entries',
    filters: 'Filters',
    clearFilters: 'Clear filters',
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',
    pageInfo: 'Page {current} of {total} — {count} entries',
    prev: 'Previous',
    next: 'Next',
  },

  // CASH_FLOW_REPORT_KEYS
  cashFlow: {
    title: 'Cash flow',
    subtitle: 'Analysis of inflows and outflows by account',
    // KPIs
    kpiTotalInflow: 'Total inflows',
    kpiTotalOutflow: 'Total outflows',
    kpiNetCashFlow: 'Net flow',
    // Charts
    chartInflowOutflow: 'Inflows vs outflows by group',
    chartNetOverTime: 'Cash flow over time',
    inflow: 'Inflows',
    outflow: 'Outflows',
    net: 'Net',
    // Table
    tableTitle: 'Summary by account',
    colGroup: 'Group',
    colInflow: 'Inflows',
    colOutflow: 'Outflows',
    colNet: 'Net',
    totalsLabel: 'Totals',
    // Filters
    filterAccount: 'Account',
    filterWarehouse: 'Warehouse',
    filterAll: 'All',
    // Common
    from: 'From:',
    to: 'To:',
    noData: 'No data',
    entries: 'entries',
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',
    pageInfo: 'Page {current} of {total} — {count} entries',
    prev: 'Previous',
    next: 'Next',
  },

  // SELLERS_REPORT_KEYS
  sellers: {
    title: 'Salesperson report',
    subtitle: 'Salesperson performance and statistics',
    // KPIs
    kpiActiveSellers: 'Active salespeople',
    kpiTotalSales: 'Total sales',
    kpiTotalPaid: 'Total collected',
    kpiTotalDue: 'Total unpaid',
    // Charts
    chartTopSellers: 'Top salespeople by amount',
    chartDailyTrend: 'Daily sales trend',
    // Table
    tableTitle: 'Statistics by salesperson',
    colSeller: 'Salesperson',
    colSalesCount: 'Sales count',
    colTotal: 'Total',
    colPaid: 'Collected',
    colDue: 'Unpaid',
    colCollectionRate: 'Collection rate',
    // Filters
    filterSearchSeller: 'Search a salesperson...',
    filterWarehouse: 'Warehouse',
    filterAll: 'All',
    // Common
    from: 'From:',
    to: 'To:',
    noData: 'No data',
    entries: 'entries',
    filters: 'Filters',
    clearFilters: 'Clear filters',
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',
    pageInfo: 'Page {current} of {total} — {count} entries',
    prev: 'Previous',
    next: 'Next',
  },

  // PROFIT_LOSS_REPORT_KEYS
  profitLoss: {
    title: 'Profit & Loss',
    subtitle: 'Profitability and financial flow analysis',
    // Top KPIs
    sales: 'Sales',
    purchases: 'Purchases',
    salesReturn: 'Sale returns',
    purchasesReturn: 'Purchase returns',
    // Financial Summary
    summaryTitle: 'Financial summary',
    revenue: 'Revenue',
    revenueDesc: 'Sales – Sale returns',
    paymentsReceived: 'Payments received',
    paymentsReceivedDesc: 'Sale payments + Purchase returns',
    paymentsSent: 'Payments sent',
    paymentsSentDesc: 'Purchase payments + Sale returns + Expenses',
    expenses: 'Expenses',
    paymentsNet: 'Net payments',
    paymentsNetDesc: 'Received – Sent',
    // Profit
    profitSection: 'Profitability',
    profitFifo: 'Net profit (FIFO)',
    profitAvg: 'Net profit (Average cost)',
    profitDesc: 'Sales – Cost of goods – Expenses',
    // Chart
    chartTitle: 'Overview',
    chartRevenue: 'Revenue',
    chartCogs: 'Cost',
    chartExpenses: 'Expenses',
    chartProfit: 'Profit',
    // Filters
    filterWarehouse: 'Warehouse',
    filterAll: 'All',
    from: 'From:',
    to: 'To:',
    // Common
    noData: 'No data',
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',
  },

  // RETURN_RATIO_REPORT_KEYS
  returnRatio: {
    title: 'Return rate',
    subtitle: 'Return analysis by user and warehouse',
    // KPIs
    kpiTotalSales: 'Total sales',
    kpiTotalReturns: 'Total returns',
    kpiReturnRate: 'Return rate',
    kpiReturnAmount: 'Returned amount',
    // Charts
    chartTopUsers: 'Top users by returns',
    chartReturnTrend: 'Returns trend',
    returns: 'Returns',
    salesLabel: 'Sales',
    // Table
    tableTitle: 'Detail by user',
    colUser: 'User',
    colSalesCount: 'Sales count',
    colSalesAmount: 'Sales amount',
    colReturnsCount: 'Returns count',
    colReturnsAmount: 'Returns amount',
    colReturnRate: 'Return rate',
    noUser: 'Unassigned',
    totalsLabel: 'Totals',
    // Filters
    filterWarehouse: 'Warehouse',
    filterAll: 'All',
    from: 'From:',
    to: 'To:',
    // Common
    noData: 'No data',
    entries: 'entries',
    noExportData: 'No data to export',
    exportSuccess: 'Export successful',
    exportError: 'Export error',
    pageInfo: 'Page {current} of {total} — {count} entries',
    prev: 'Previous',
    next: 'Next',
  },

  // ═══════════════ DELIVERIES ═══════════════

  deliveries: {
    // Tour steps
    tourTitle: 'Delivery management',
    tourDesc: 'Here you track all delivery operations. Each delivery contains a set of orders assigned to a driver with a specific vehicle.',
    tourAddTitle: 'Create a new delivery',
    tourAddDesc: 'Click here to create a new delivery run. Choose the driver and vehicle, and add the confirmed orders to deliver.',
    tourKpisTitle: 'Performance indicators',
    tourKpisDesc: 'Quick view of performance: number of deliveries, success rate, amounts collected and orders ready to dispatch.',
    tourChipsTitle: 'Quick filtering',
    tourChipsDesc: 'Click a status to filter quickly. You can also open the advanced filter panel for a more precise search.',
    tourListTitle: 'Deliveries list',
    tourListDesc: 'Each card shows delivery details: driver, vehicle, order count, progress bar and amounts. Click "View" for full details.',
    // Header
    title: 'Delivery management',
    subtitle: 'Track and manage delivery operations',
    tourButton: 'Guided tour',
    addNew: 'Create a delivery',
    addNewShort: 'Add',
    // Errors / toasts
    loadError: 'Error loading data',
    startConfirm: 'Do you want to start this delivery? Products will be deducted from stock.',
    startSuccess: 'Delivery started successfully',
    startError: 'Error while starting the delivery',
    // Status labels
    preparing: 'Preparing',
    inProgress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    // KPIs
    kpiTotal: 'Total deliveries',
    kpiSuccessRate: 'Success rate',
    kpiDelivered: 'Delivered / Total',
    kpiFailed: 'Failures / Returns',
    kpiCollected: 'Collected',
    kpiUnassigned: 'Orders ready',
    // Search & chips
    searchPlaceholder: 'Search by reference, driver, vehicle...',
    chipAll: 'All',
    chipPreparing: 'Preparing',
    chipInProgress: 'In progress',
    chipCompleted: 'Completed',
    chipCancelled: 'Cancelled',
    advancedFilters: 'Advanced filters',
    clearAll: 'Clear all',
    // Expanded filters
    filterDriver: 'Driver',
    filterAllDrivers: 'All drivers',
    filterCollection: 'Collection status',
    filterAllCollection: 'All',
    filterCollected: 'Fully collected',
    filterPartial: 'Partially collected',
    filterPending: 'Not collected',
    filterFromDate: 'Start date',
    filterToDate: 'End date',
    // Results count
    deliveriesUnit: 'delivery(ies)',
    ofTotal: 'of {total}',
    todayBadge: 'Today: {count} delivery(ies) ({active} in progress)',
    // Empty state
    noResults: 'No deliveries found',
    clearFilters: 'Clear filters',
    // Card
    failed: 'failure(s)',
    collected: 'Collected',
    // Actions
    start: 'Start',
    view: 'View',
    // Pagination
    previous: 'Previous',
    next: 'Next',
  },
  auth: {
    // Shared
    backHome: 'Back to home',
    languageToggle: 'Language',
    // Login
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to access your dashboard',
    identifierLabel: 'Phone or email',
    identifierHint: 'Use the same details as at sign-up',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    loginSuccess: 'Signed in successfully',
    loginError: 'Sign-in error. Check your details and try again',
    noAccount: 'No account yet?',
    createAccountLink: 'Create a free account',
    // Register
    registerTitle: 'Create your TrackSera account',
    registerSubtitle: 'Full 14-day trial — no credit card',
    registerWhy: 'Our team will call you within 24h to help set up your account and train you on the system',
    companyLabel: 'Company name',
    companyPlaceholder: 'e.g. alnajah',
    companyHint: 'A single word, no spaces — will appear in your account URL',
    fullNameLabel: 'Your full name',
    fullNamePlaceholder: 'Ahmed Benslimane',
    fullNameHint: 'The name shown to other users in the system',
    phoneLabel: 'Phone number',
    phoneHint: 'Used to activate your account. Never shared with third parties',
    passwordRegLabel: 'Password',
    passwordRegPlaceholder: 'At least 6 characters',
    passwordConfirmLabel: 'Confirm password',
    passwordConfirmPlaceholder: 'Re-enter the password',
    showPassword: 'Show password',
    acceptCallLabel: 'I accept that the TrackSera team contacts me by phone to help set up my account',
    creatingAccount: 'Creating your account...',
    creatingHint: 'This may take 10-30 seconds. Please do not close the page',
    createFreeAccount: 'Create free account',
    creating: 'Creating...',
    termsAgree: 'By creating an account, you agree to the terms of service and privacy policy',
    haveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    // Validation errors
    errCompanySpaces: 'The company name must be a single word without spaces',
    errPasswordMismatch: 'Passwords do not match',
    errPhoneInvalid: 'Invalid phone number',
    errCreateAccount: 'An error occurred while creating the account. Please try again',
    // Trust signals
    trust1: '14 days free',
    trust2: 'No credit card',
    trust3: 'Support in Arabic and French',
    trust4: 'Setup in 5 minutes',
    // Setup screen (post-registration)
    setupBadge: 'Initializing',
    setupHeading: 'Setting up your account',
    setupSubheading: 'We\'re preparing your database and configuring everything — this takes 10–30 seconds',
    setupFooter: 'Don\'t close this page — you\'ll be redirected automatically when done',
    setupStep1Title: 'Creating account',
    setupStep1Caption: 'Verifying data and saving',
    setupStep2Title: 'Preparing the database',
    setupStep2Done: 'Database ready',
    setupStep3Title: 'Final touches',
    setupStep3Caption: 'Preparing the dashboard and redirecting',
    setupSys1: 'Verifying data',
    setupSys2: 'Creating the database',
    setupSys3: 'Running migrations',
    setupSys4: 'Configuring default categories',
    setupSys5: 'Configuring permissions',
    setupSys6: 'Preparing the main warehouse',
    setupSys7: 'Final touches',
  },
} as const;

export default en_part4;
