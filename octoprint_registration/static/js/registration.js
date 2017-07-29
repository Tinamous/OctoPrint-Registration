/*
 * View model for OctoPrint-Registration
 *
 * Author: Stephen Harrison
 * License: AGPLv3
 */
$(function() {

    function RegistrationRegisterUserViewModel(showpopup) {
        var self = this;
        self._showpopup = showpopup;
        self.pluginId = "registration";
        self.username = ko.observable("");
        self.password = ko.observable("");
        self.confirmPassword = ko.observable("");
        self.displayName = ko.observable("");
        self.emailAddress = ko.observable("");
        self.phoneNumber = ko.observable("");
        self.twitterUsername = ko.observable("");
        self.tinamousUsername = ko.observable("");
        self.slackUsername = ko.observable("");
        self.printInPrivate = ko.observable(false);
        self.keyfobId = ko.observable("");

        self.captureTagText = ko.observable("Capture");
        self.captureRfidTag = ko.observable(false);

        self.captureTag = function() {
            console.log("Waiting for user tag to be seen.")
            self.keyfobId("");
            self.captureRfidTag(true);
            self.captureTagText("Waiting...");

            // TODO: Timeout so we don't stay in capture mode.
        };

        self.tagSeen = function(data) {
            if (self.captureRfidTag()) {
                console.log("KeyFobId from plugin data: " + data.keybobId);
                self.keyfobId(data.tagId);
                self.captureRfidTag(false);
                self.captureTagText("Capture");
            } else {
                console.warn("Tag seen but not in capture tag mode.")
            }
        }

        self.register = function() {
            console.log("Register user. Plugin Id: " + self.pluginId)
            self.captureRfidTag(false);
            self.captureTagText("Capture");

            if (self.password() != self.confirmPassword()) {
                console.error("Password and confirm password do not match");
                alert("Passwords do not match");
            }

            var registerUser = {
                username: self.username(),
                password: self.password(),
                displayName: self.displayName(),
                emailAddress: self.emailAddress(),
                phoneNumber: self.phoneNumber(),
                twitter: self.twitterUsername(),
                tinamous: self.tinamousUsername(),
                slack: self.slackUsername(),
                printInPrivate: self.printInPrivate(),
                keyfobId: self.keyfobId()
            };

            // Uses the blueprint api.
            $.post("/plugin/registration/register", registerUser)
                .done(function() {
                    console.log("registered");
                    $("#registration_register_dialog").modal('hide');
                    self.username("");
                    self.password("");
                    self.confirmPassword("");
                    self.displayName("");
                    self.emailAddress("");
                    self.phoneNumber("");
                    self.twitterUsername("");
                    self.tinamousUsername("");
                    self.slackUsername("");
                    self.printInPrivate("");
                    self.keyfobId("");

                    var options = {
                        title: "Welcome! User Registered",
                        text: "Your OctoPrint has been created.",
                        hide: false,
                        type: "success" // type: "error",
                    };

                    self._showpopup(options, {});
                })
                .error(function() {
                    var options = {
                        title: "User Registration Error",
                        text: "An error occured registering the user account.",
                        type: "error"
                    };

                    self._showpopup(options, {});
                });
        };

        return self;
    }

    function RegistrationUpdateUserViewModel(showpopup) {
        var self = this;

        self._showpopup = showpopup;
        self.pluginId = "registration";
        self.displayName = ko.observable("Ekk!");
        self.emailAddress = ko.observable("");
        self.phoneNumber = ko.observable("");
        self.twitterUsername = ko.observable("");
        self.tinamousUsername = ko.observable("");
        self.slackUsername = ko.observable("");
        self.printInPrivate = ko.observable(false);
        self.keyfobId = ko.observable("");

        self.captureTagText = ko.observable("Capture");
        self.captureRfidTag = ko.observable(false);

        self.setUser = function(user) {
            self.displayName(user.settings.displayName);
            self.emailAddress(user.settings.emailAddress);
            self.phoneNumber(user.settings.phoneNumber);
            self.twitterUsername(user.settings.twitter);
            self.tinamousUsername(user.settings.tinamous);
            self.slackUsername(user.settings.slack);
            self.printInPrivate(user.settings.printInPrivate);
            self.keyfobId(user.settings.keyfobId);
        }

        self.captureTag = function() {
            console.log("Waiting for user tag to be seen.")
            self.keyfobId("");
            self.captureRfidTag(true);
            self.captureTagText("Waiting...");

            // TODO: Timeout so we don't stay in capture mode.
        };

        self.tagSeen = function(data) {
            if (self.captureRfidTag()) {
                console.log("KeyFobId from plugin data: " + data.keybobId);
                self.keyfobId(data.tagId);
                self.captureRfidTag(false);
                self.captureTagText("Capture");
            } else {
                console.warn("Tag seen but not in capture tag mode.")
            }
        };

        self.update = function() {
            self.captureRfidTag(false);
            self.captureTagText("Capture");

            // Ensure all the parameters are supplied even if not set.
            var updateUserPayload = {
                displayName: self.displayName() || "",
                emailAddress: self.emailAddress() || "",
                phoneNumber: self.phoneNumber() || "",
                twitter: self.twitterUsername() || "",
                tinamous: self.tinamousUsername() || "",
                slack: self.slackUsername() || "",
                printInPrivate: self.printInPrivate(),
                keyfobId: self.keyfobId() || ""
            };

            OctoPrint.simpleApiCommand(self.pluginId, "UpdateUser", updateUserPayload, {})
                .done(function() {
                    $("#registration_update_user_dialog").modal('hide');

                    var options = {
                        title: "User Settings Updated",
                        text: "User settings have been updated. Please logout and back in for them to take effect.",
                        type: "success"
                    };

                    self._showpopup(options, {});
                })
                .error(function() {
                    var options = {
                        title: "User Settings Error",
                        text: "An error occured updating user settings.",
                        type: "error"
                    };

                    self._showpopup(options, {});
                });
        };

        return self;
    }

    function RegistrationViewModel(parameters) {
        var self = this;

        self.pluginId = "registration";

        self.loginStateViewModel = parameters[0];
        self.settingsViewModel = parameters[1];
        self.printer = parameters[2];

        // showPopup isn't available initially
        self._showpopup = function(options, eventListeners) {
            self._closePopup();
            self.popup = new PNotify(options);

            if (eventListeners) {
                var popupObj = self.popup.get();
                _.each(eventListeners, function(value, key) {
                    popupObj.on(key, value);
                })
            }
        };

        self._closePopup = function() {
            if (self.popup !== undefined) {
                self.popup.remove();
            }
        };

        // Registration view model.
        self.registerUserViewModel = new RegistrationRegisterUserViewModel(self._showpopup);
        self.updateUserViewModel = new RegistrationUpdateUserViewModel(self._showpopup);

        // Helper for Knockout binding to tell if the user
        // is not logged in (hence we should show the
        // register option, otherwise we should show the update
        // dialog box option
        self.notLoggedIn = ko.computed(function() {
            return !self.loginStateViewModel.isUser();
        });

        self.onBeforeBinding = function () {
            self.settings = self.settingsViewModel.settings.plugins.registration;
        };

        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "registration") {
                return;
            }

            // Any tag seen. This can probably be ignored
            // as only Unknown Rfid Tags should be used for registration.
            if (data.eventEvent == "RfidTagSeen") {
                console.log("Registration: User tag seen. TagId:" + data.eventPayload.tagId);
                self.registerUserViewModel.tagSeen(data.eventPayload);
            }
        };

        self.onUserLoggedIn = function(user) {
            self.updateUserViewModel.setUser(user);
        };
    }

    // view model class, parameters for constructor, container to bind to
        // New style config .
    OCTOPRINT_VIEWMODELS.push({
        construct: RegistrationViewModel,
        additionalNames: [],
        dependencies: ["loginStateViewModel", "settingsViewModel", "printerStateViewModel"],
        optional: [],
        elements: ["#navbar_plugin_registration"]
    });
});
