# coding=utf-8
from __future__ import absolute_import

from flask import request, jsonify, abort, make_response
from flask.ext.login import current_user

import flask

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started,
# defining your plugin as a template plugin, settings and asset plugin. Feel free to add or remove mixins
# as necessary.
#
# Take a look at the documentation on what other plugin mixins are available.

import octoprint.plugin

# Allow users to register with OctoPrint.
# Uses:
#  Blueprint for non-authenticated registration
#  Simple Api for authenticated user update
#  EventHandler for capturing RFID tag events from other (Who's Printing) plugins
class RegistrationPlugin(octoprint.plugin.SettingsPlugin,
                         octoprint.plugin.AssetPlugin,
                         octoprint.plugin.TemplatePlugin,
                         octoprint.plugin.EventHandlerPlugin,
                         octoprint.plugin.SimpleApiPlugin,
                         octoprint.plugin.BlueprintPlugin):

	##~~ SettingsPlugin mixin

	def get_settings_defaults(self):
		return dict(
			# put your plugin's default settings here
			# enable/disable?
			# show rfid option?
			showKeyFobOption=True,
			showInternetVisibleOption=True,
		)

	##~~ AssetPlugin mixin

	def get_assets(self):
		# Define your plugin's asset files to automatically include in the
		# core UI here.
		return dict(
			js=["js/registration.js"]
		)

	##~~ Simple API mixin
	def get_api_commands(self):
		self._logger.info("On api get commands")

		return dict(
			UpdateUserOld=["displayName", "emailAddress", "phoneNumber", "twitter", "tinamous", "slack", "printInPrivate", "keyfobId"],
			UpdateUser = []
		)

	# API POST command
	def on_api_command(self, command, data):
		self._logger.info("Registration: on_api_command Data: {}".format(data))

		if current_user is None or current_user.is_anonymous():
			self._logger.warn("Update user details when user is not logged in.")
			return make_response(("Forbidden", 403, []))

		# Does not support updating the user password, this needs to be
		# done by OctoPrints user settings
		if command == "UpdateUser":
			# data contains: "displayName", "emailAddress", "phoneNumber", "twitter", "tinamous", "slack", "printInPrivate", "keyfobId"
			self.update_user(data)

	##~~ Blueprint mixin

	# Blueprint for registration needs to be unprotected.
	def is_blueprint_protected(self):
		self._logger.info("registration blueprint (not) protected...")
		return False

	# API BluePrint implementation for registration
	# Needs to be done as blueprint so that protection can be disabled.
	@octoprint.plugin.BlueprintPlugin.route("/register", methods=["POST"])
	def api_register_user(self):
		self._logger.info("Blueprint register user called")

		if not "username" in flask.request.values:
			self._logger.warn("Register user missing username.")
			return flask.make_response("Username is required.", 400)

		if not "password" in flask.request.values:
			self._logger.warn("Register user missing password.")
			return flask.make_response("Password is required.", 400)

		# Other parameters are optional.

		payload = dict(
			username = flask.request.values["username"],
			password = flask.request.values["password"],
			displayName = flask.request.values["displayName"],
			emailAddress = flask.request.values["emailAddress"],
			phoneNumber = flask.request.values["phoneNumber"],
			twitter = flask.request.values["twitter"],
			tinamous = flask.request.values["tinamous"],
			slack = flask.request.values["slack"],
			printInPrivate = flask.request.values["printInPrivate"],
			keyfobId = flask.request.values["keyfobId"],
		)

		if self.register_user(payload):
			self._logger.info("User '{0}' registered.".format(flask.request.values["username"]))
			return flask.make_response("Created.", 201)
		else :
			self._logger.info("Failed to register user '{0}'.".format(flask.request.values["username"]))
			return flask.make_response("Failed to register user.", 501)

	##~~ Event Plugin
	# EventHandler Plugin
	def on_event(self, event, payload):
		# Custom event raised by Who's Printing RFID plugin
		if event == "RfidTagSeen":
			pluginData = dict(eventEvent="RfidTagSeen", eventPayload=payload)
			self._plugin_manager.send_plugin_message(self._identifier, pluginData)

	##~~ Softwareupdate hook

	def get_update_information(self):
		# Define the configuration for your plugin to use with the Software Update
		# Plugin here. See https://github.com/foosel/OctoPrint/wiki/Plugin:-Software-Update
		# for details.
		return dict(
			registration=dict(
				displayName="Registration Plugin",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="Tinamous",
				repo="OctoPrint-Registration",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/Tinamous/OctoPrint-Registration/archive/{target_version}.zip"
			)
		)

	##~~ Implementation

	def register_user(self, data):
		# expect the following to be provided in the data.
		# "username", "password", "displayName", "emailAddress", "phoneNumber", "twitterUsername", "printInPrivate", "keyfobId"
		# add the user to the "whosprinting" group so they can be filtered when showing the
		# dropdown option of who's printing.
		# Set API Key to none and not to overwrite.

		# TODO: How do we handle the username already having been registered
		# TODO: Ensure the tag is not already registered

		username = data["username"]
		self._logger.info("Create user. {0}".format(username))
		self._user_manager.addUser(username, data["password"], True, ["user", "whosprinting"], None, False)
		self._logger.info("User created.")

		userSettings = dict(
			displayName=data["displayName"],
			emailAddress=data["emailAddress"],
			phoneNumber=data["phoneNumber"],
			twitter=data["twitter"],
			tinamous=data["tinamous"],
			slack=data["slack"],
			printInPrivate=data.get("printInPrivate", False),
			keyfobId=data["keyfobId"],
		)
		self._user_manager.changeUserSettings(username, userSettings)
		self._logger.info("User settings updated.")

		return True

	# Do we need to raise an event to indicate that a user has been added
	# so that the who's printing selector can be updated.
	# or is SETTINGS_UPDATED fired?

	def update_user(self, data):
		username = current_user.get_name()
		self._logger.info("Update user '{0}' settings.".format(username))

		# "displayName", "emailAddress", "phoneNumber", "twitter","tinamous", "slack", "printInPrivate", "keyfobId"
		userSettings = dict(
			displayName=data["displayName"],
			emailAddress=data["emailAddress"],
			phoneNumber=data["phoneNumber"],
			twitter=data["twitter"],
			tinamous=data["tinamous"],
			slack=data["slack"],
			printInPrivate=data.get("printInPrivate", False),
			keyfobId=data["keyfobId"],
		)
		self._user_manager.changeUserSettings(username, userSettings)
		# User stored in session_users_.... and so needs to logout
		# and back in again for this to be updated.
		self._logger.info("User settings updated.")

	def find_user_from_tag(self, tagId):
		self._logger.info("Getting user for tag {0}".format(tagId))

		users = self._user_manager.getAllUsers()
		for user in users:
			user_settings = user["settings"]
			user_key_fob = user_settings.get("keyfobId")
			if tagId == user_key_fob:
				return user

		self._logger.info("No user found for tag")
		return None


# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Registration"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = RegistrationPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}

