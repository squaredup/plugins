function toState(status) {
    return status === 'Ok' ? 'success' : 'error';
}

result = [
    {
        "service": "Overall",
        "status": data.overallstatus ? 'success' : 'error'
    },
    {
        "service": "Lookup",
        "status": data.lookupservicesup ? 'success' : 'error'
    },
    {
        "service": "Email validation",
        "status": toState(data.emailvalidation)
    },
    {
        "service": "Mobile validation",
        "status": toState(data.mobilevalidation)
    },
    {
        "service": "Bank validation",
        "status": toState(data.bankvalidation)
    },
    {
        "service": "OTP verification",
        "status": toState(data.otpverification)
    },
];
