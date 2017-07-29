# OctoPrint-Registration

User registration plugin. Allows people to register with the OctoPrint instance. Includes optional additional information that may be useful for other plugins such as:

* Display Name - A more friendly name to show on the UI (e.g. who's printing)
* Email address
* Contact number
* Twitter username
* Tinamous username
* Slack username
* No Photos/Videos option - indicate to plugins that support this that photos/videos of the print should not be published.
* Key Fob - Optional RFID fob id for use with Who's Printing plugin

These optional settings allow plugins such as email, twitter, tinamous, slack or other notifiers to use this information to directly send the user a notification such as when the print has finished.

Note that when updating the user settings you need to logout and back in otherwise the cached user setting may report incorrect user settings (e.g. if you just refresh the page).

User password should be changed using the existing OctoPrint User Settings dialog box.

When a user is registered they are assigned the roles 'user' and 'whosprinting'.

The whosprinting role is used by the Who's Printing plugin to allow for filtering of users in the dropdown list.

## Setup

Install via the bundled [Plugin Manager](https://github.com/foosel/OctoPrint/wiki/Plugin:-Plugin-Manager)
or manually using this URL:

    https://github.com/Tinamous/OctoPrint-Registration/archive/master.zip

the plugin manager.

## Configuration

No additional configuration is needed. Optional user settings are stored using the built in user management system of OctoPrint, if you have overriden this ensure that user settings are handled.
