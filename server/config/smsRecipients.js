// config/smsRecipients.js
// Each recipient has a `group` tag.
// The SMS notifier filters by the SMS_NOTIFY_GROUPS env var.
//
// Examples:
//   SMS_NOTIFY_GROUPS=dev          → only Andy gets texts (testing)
//   SMS_NOTIFY_GROUPS=dev,family   → everyone gets texts (production)
//   (unset / empty)                → everyone gets texts (default = all groups)

module.exports = [
  { name: 'Andy', phone: '+18012433863', group: 'dev' },
  { name: 'Babe-a! 😘', phone: '+18016046399', group: 'family' },
  // { name: 'Huds', phone: '+13857077465', group: 'family' },
];
