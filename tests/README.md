# Tests structure

In RAIN we want to cover all core features with unit tests and integrations tests. This
is why we advise every developer to write as much unit tests as possible.

## Server

For server side tests, all unit tests are placed by following the same structure:

   * tests
    * server
     * <folder that holds the module>
       *test_<module_name>

For instance we want to tests intents_registry module. The structure in lib is like:

    * lib
     * intents
     *intents_registry.js

The test module associated to intents_registry module is placed in:

    * tests
     * server
      * lib
       * intents
        * test_intent_registry.js

Because we keep the modules separated from their unit tests a helper module has been created to ease the way you include modules in your unit tests.

For instance in intents_registry we used the following approach:


    var testsHelper             = require("../../util_loader")
        , modIntentsRegistry    = testsHelper.loadModule("intents/intents_registry")
        , testCase              = testsHelper.loadModule("nodeunit").testCase;


If you hadn't used util_loader than you would have been obliged to write something like:

    var modIntentsRegistry    = require("../../../../intents/intents_registry")
        , testCase            = testsHelper.loadModule("nodeunit").testCase;