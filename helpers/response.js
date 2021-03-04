const successData = (payload, response) => {
    response.status(200);
    return response.send(
        payload
    )
}

const success = (message, response) => {
    response.status(200);
    return response.send({
        success: true,
        message
    });
}

const fail = (message,statusCode, response) => {
    response.status(statusCode)
    return response.send({
        success: false,
        message
    })
}

module.exports = {
    successData,
    success,
    fail
};