// With Index users off, the stream calls managedDeviceOverview instead of /users: a single
// object with no value array, so no rows come back and no User.Read.All permission is needed.
result = ((data && data.value) || []).map((u) => ({
    id: u.id,
    displayName: u.displayName || u.userPrincipalName,
    userPrincipalName: u.userPrincipalName,
    mail: u.mail,
    jobTitle: u.jobTitle,
    department: u.department,
    officeLocation: u.officeLocation,
    accountEnabled: u.accountEnabled
}));
