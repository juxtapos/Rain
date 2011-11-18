var RaintimeTest = TestCase('RaintimeTest', {
    setUp:function () {

    },
    "test Rainntime":function () {
        assertUndefined('Is raintime defined?', Raintime.ComponentRegistry);
    }
});
