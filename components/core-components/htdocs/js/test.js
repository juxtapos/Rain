define(['core-components/raintime/raintime'], function (Raintime) {
    console.log('Runs after Raintime has loaded and passes Raintime as an argument');
    console.log('Do we have Raintime? ' + (typeof(Raintime) === 'undefined' ? 'no' : 'yes'));

    return {};
});
