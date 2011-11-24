define(["core/client_util"], function (modUtil) {
    var modUtil = modUtil.get();

    describe("clientUtil", function () {
        describe("bind", function () {
            it("validates parameters", function () {
                var bindNull = function () { modUtil.bind(null); };

                expect(bindNull).toThrow("expected f to be a function");
            });

            it("binds scope", function () {
                var dave = {
                    name: "Dave Watson",
                    getName: function () {
                        return this.name;
                    }
                };

                var jeff = {
                    name: "Jeff Garner"
                };

                var getJeffsName = modUtil.bind(dave.getName, jeff);

                expect(getJeffsName()).toEqual(jeff.name);
            });

            it("binds a single argument", function () {
                var word = "hello"
                  , mute
                  , voice;

                function echo(sound) {
                    return sound;
                }

                mute = echo();
                voice = modUtil.bind(echo, null, "hello");

                expect(mute).toBeUndefined();
                expect(voice()).toEqual(word);
            });

            it("binds multiple arguments", function () {
                var hello = "hello"
                  , space = " "
                  , world = "world"
                  , mute
                  , voice;

                function echo() {
                    return Array.prototype.join.call(arguments, "");
                }

                mute = echo();
                voice = modUtil.bind(echo, null, hello, space, world);

                expect(mute).toEqual("");
                expect(voice()).toEqual(hello + space + world);
            });

            xit("passes arguments to binder", function () {
            });
        });
    });
});
