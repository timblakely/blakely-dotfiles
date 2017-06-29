(function() {
  var BufferedProcess, DESCRIPTION, ForkGistIdInputView, GitHubApi, PackageManager, REMOVE_KEYS, SyncSettings, _, fs, ref,
    hasProp = {}.hasOwnProperty;

  BufferedProcess = require('atom').BufferedProcess;

  fs = require('fs');

  _ = require('underscore-plus');

  ref = [], GitHubApi = ref[0], PackageManager = ref[1];

  ForkGistIdInputView = null;

  DESCRIPTION = 'Atom configuration storage operated by http://atom.io/packages/sync-settings';

  REMOVE_KEYS = ['sync-settings.gistId', 'sync-settings.personalAccessToken', 'sync-settings._analyticsUserId', 'sync-settings._lastBackupHash'];

  SyncSettings = {
    config: require('./config.coffee'),
    activate: function() {
      return setImmediate((function(_this) {
        return function() {
          var mandatorySettingsApplied;
          if (GitHubApi == null) {
            GitHubApi = require('github');
          }
          if (PackageManager == null) {
            PackageManager = require('./package-manager');
          }
          atom.commands.add('atom-workspace', "sync-settings:backup", function() {
            return _this.backup();
          });
          atom.commands.add('atom-workspace', "sync-settings:restore", function() {
            return _this.restore();
          });
          atom.commands.add('atom-workspace', "sync-settings:view-backup", function() {
            return _this.viewBackup();
          });
          atom.commands.add('atom-workspace', "sync-settings:check-backup", function() {
            return _this.checkForUpdate();
          });
          atom.commands.add('atom-workspace', "sync-settings:fork", function() {
            return _this.inputForkGistId();
          });
          mandatorySettingsApplied = _this.checkMandatorySettings();
          if (atom.config.get('sync-settings.checkForUpdatedBackup') && mandatorySettingsApplied) {
            return _this.checkForUpdate();
          }
        };
      })(this));
    },
    deactivate: function() {
      var ref1;
      return (ref1 = this.inputView) != null ? ref1.destroy() : void 0;
    },
    serialize: function() {},
    getGistId: function() {
      var gistId;
      gistId = atom.config.get('sync-settings.gistId');
      if (gistId) {
        gistId = gistId.trim();
      }
      return gistId;
    },
    getPersonalAccessToken: function() {
      var token;
      token = atom.config.get('sync-settings.personalAccessToken');
      if (token) {
        token = token.trim();
      }
      return token;
    },
    checkMandatorySettings: function() {
      var missingSettings;
      missingSettings = [];
      if (!this.getGistId()) {
        missingSettings.push("Gist ID");
      }
      if (!this.getPersonalAccessToken()) {
        missingSettings.push("GitHub personal access token");
      }
      if (missingSettings.length) {
        this.notifyMissingMandatorySettings(missingSettings);
      }
      return missingSettings.length === 0;
    },
    checkForUpdate: function(cb) {
      if (cb == null) {
        cb = null;
      }
      if (this.getGistId()) {
        console.debug('checking latest backup...');
        return this.createClient().gists.get({
          id: this.getGistId()
        }, (function(_this) {
          return function(err, res) {
            var SyntaxError, message, ref1, ref2;
            if (err) {
              console.error("error while retrieving the gist. does it exists?", err);
              try {
                message = JSON.parse(err.message).message;
                if (message === 'Not Found') {
                  message = 'Gist ID Not Found';
                }
              } catch (error1) {
                SyntaxError = error1;
                message = err.message;
              }
              atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
              return typeof cb === "function" ? cb() : void 0;
            }
            if ((res != null ? (ref1 = res.history) != null ? (ref2 = ref1[0]) != null ? ref2.version : void 0 : void 0 : void 0) == null) {
              console.error("could not interpret result:", res);
              atom.notifications.addError("sync-settings: Error retrieving your settings.");
              return typeof cb === "function" ? cb() : void 0;
            }
            console.debug("latest backup version " + res.history[0].version);
            if (res.history[0].version !== atom.config.get('sync-settings._lastBackupHash')) {
              _this.notifyNewerBackup();
            } else if (!atom.config.get('sync-settings.quietUpdateCheck')) {
              _this.notifyBackupUptodate();
            }
            return typeof cb === "function" ? cb() : void 0;
          };
        })(this));
      } else {
        return this.notifyMissingMandatorySettings(["Gist ID"]);
      }
    },
    notifyNewerBackup: function() {
      var notification, workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      return notification = atom.notifications.addWarning("sync-settings: Your settings are out of date.", {
        dismissable: true,
        buttons: [
          {
            text: "Backup",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:backup");
              return notification.dismiss();
            }
          }, {
            text: "View backup",
            onDidClick: function() {
              return atom.commands.dispatch(workspaceElement, "sync-settings:view-backup");
            }
          }, {
            text: "Restore",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:restore");
              return notification.dismiss();
            }
          }, {
            text: "Dismiss",
            onDidClick: function() {
              return notification.dismiss();
            }
          }
        ]
      });
    },
    notifyBackupUptodate: function() {
      return atom.notifications.addSuccess("sync-settings: Latest backup is already applied.");
    },
    notifyMissingMandatorySettings: function(missingSettings) {
      var context, errorMsg, notification;
      context = this;
      errorMsg = "sync-settings: Mandatory settings missing: " + missingSettings.join(', ');
      return notification = atom.notifications.addError(errorMsg, {
        dismissable: true,
        buttons: [
          {
            text: "Package settings",
            onDidClick: function() {
              context.goToPackageSettings();
              return notification.dismiss();
            }
          }
        ]
      });
    },
    backup: function(cb) {
      var cmtend, cmtstart, ext, file, files, j, len, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      if (cb == null) {
        cb = null;
      }
      files = {};
      if (atom.config.get('sync-settings.syncSettings')) {
        files["settings.json"] = {
          content: this.getFilteredSettings()
        };
      }
      if (atom.config.get('sync-settings.syncPackages')) {
        files["packages.json"] = {
          content: JSON.stringify(this.getPackages(), null, '\t')
        };
      }
      if (atom.config.get('sync-settings.syncKeymap')) {
        files["keymap.cson"] = {
          content: (ref1 = this.fileContent(atom.keymaps.getUserKeymapPath())) != null ? ref1 : "# keymap file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncStyles')) {
        files["styles.less"] = {
          content: (ref2 = this.fileContent(atom.styles.getUserStyleSheetPath())) != null ? ref2 : "// styles file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncInit')) {
        files["init.coffee"] = {
          content: (ref3 = this.fileContent(atom.config.configDirPath + "/init.coffee")) != null ? ref3 : "# initialization file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncSnippets')) {
        files["snippets.cson"] = {
          content: (ref4 = this.fileContent(atom.config.configDirPath + "/snippets.cson")) != null ? ref4 : "# snippets file (not found)"
        };
      }
      ref6 = (ref5 = atom.config.get('sync-settings.extraFiles')) != null ? ref5 : [];
      for (j = 0, len = ref6.length; j < len; j++) {
        file = ref6[j];
        ext = file.slice(file.lastIndexOf(".")).toLowerCase();
        cmtstart = "#";
        if (ext === ".less" || ext === ".scss" || ext === ".js") {
          cmtstart = "//";
        }
        if (ext === ".css") {
          cmtstart = "/*";
        }
        cmtend = "";
        if (ext === ".css") {
          cmtend = "*/";
        }
        files[file] = {
          content: (ref7 = this.fileContent(atom.config.configDirPath + ("/" + file))) != null ? ref7 : cmtstart + " " + file + " (not found) " + cmtend
        };
      }
      return this.createClient().gists.edit({
        id: this.getGistId(),
        description: atom.config.get('sync-settings.gistDescription'),
        files: files
      }, function(err, res) {
        var SyntaxError, message;
        if (err) {
          console.error("error backing up data: " + err.message, err);
          try {
            message = JSON.parse(err.message).message;
            if (message === 'Not Found') {
              message = 'Gist ID Not Found';
            }
          } catch (error1) {
            SyntaxError = error1;
            message = err.message;
          }
          atom.notifications.addError("sync-settings: Error backing up your settings. (" + message + ")");
        } else {
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully backed up. <br/><a href='" + res.html_url + "'>Click here to open your Gist.</a>");
        }
        return typeof cb === "function" ? cb(err, res) : void 0;
      });
    },
    viewBackup: function() {
      var Shell, gistId;
      Shell = require('shell');
      gistId = this.getGistId();
      return Shell.openExternal("https://gist.github.com/" + gistId);
    },
    getPackages: function() {
      var apmInstallSource, i, metadata, name, packages, ref1, theme, version;
      packages = [];
      ref1 = this._getAvailablePackageMetadataWithoutDuplicates();
      for (i in ref1) {
        metadata = ref1[i];
        name = metadata.name, version = metadata.version, theme = metadata.theme, apmInstallSource = metadata.apmInstallSource;
        packages.push({
          name: name,
          version: version,
          theme: theme,
          apmInstallSource: apmInstallSource
        });
      }
      return _.sortBy(packages, 'name');
    },
    _getAvailablePackageMetadataWithoutDuplicates: function() {
      var i, j, len, package_metadata, packages, path, path2metadata, pkg_name, pkg_path, ref1, ref2;
      path2metadata = {};
      package_metadata = atom.packages.getAvailablePackageMetadata();
      ref1 = atom.packages.getAvailablePackagePaths();
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        path = ref1[i];
        path2metadata[fs.realpathSync(path)] = package_metadata[i];
      }
      packages = [];
      ref2 = atom.packages.getAvailablePackageNames();
      for (i in ref2) {
        pkg_name = ref2[i];
        pkg_path = atom.packages.resolvePackagePath(pkg_name);
        if (path2metadata[pkg_path]) {
          packages.push(path2metadata[pkg_path]);
        } else {
          console.error('could not correlate package name, path, and metadata');
        }
      }
      return packages;
    },
    restore: function(cb) {
      if (cb == null) {
        cb = null;
      }
      return this.createClient().gists.get({
        id: this.getGistId()
      }, (function(_this) {
        return function(err, res) {
          var SyntaxError, callbackAsync, file, filename, message, ref1;
          if (err) {
            console.error("error while retrieving the gist. does it exists?", err);
            try {
              message = JSON.parse(err.message).message;
              if (message === 'Not Found') {
                message = 'Gist ID Not Found';
              }
            } catch (error1) {
              SyntaxError = error1;
              message = err.message;
            }
            atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
            return;
          }
          callbackAsync = false;
          ref1 = res.files;
          for (filename in ref1) {
            if (!hasProp.call(ref1, filename)) continue;
            file = ref1[filename];
            switch (filename) {
              case 'settings.json':
                if (atom.config.get('sync-settings.syncSettings')) {
                  _this.applySettings('', JSON.parse(file.content));
                }
                break;
              case 'packages.json':
                if (atom.config.get('sync-settings.syncPackages')) {
                  callbackAsync = true;
                  _this.installMissingPackages(JSON.parse(file.content), cb);
                }
                break;
              case 'keymap.cson':
                if (atom.config.get('sync-settings.syncKeymap')) {
                  fs.writeFileSync(atom.keymaps.getUserKeymapPath(), file.content);
                }
                break;
              case 'styles.less':
                if (atom.config.get('sync-settings.syncStyles')) {
                  fs.writeFileSync(atom.styles.getUserStyleSheetPath(), file.content);
                }
                break;
              case 'init.coffee':
                if (atom.config.get('sync-settings.syncInit')) {
                  fs.writeFileSync(atom.config.configDirPath + "/init.coffee", file.content);
                }
                break;
              case 'snippets.cson':
                if (atom.config.get('sync-settings.syncSnippets')) {
                  fs.writeFileSync(atom.config.configDirPath + "/snippets.cson", file.content);
                }
                break;
              default:
                fs.writeFileSync(atom.config.configDirPath + "/" + filename, file.content);
            }
          }
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully synchronized.");
          if (!callbackAsync) {
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this));
    },
    createClient: function() {
      var github, token;
      token = this.getPersonalAccessToken();
      console.debug("Creating GitHubApi client with token = " + token);
      github = new GitHubApi({
        version: '3.0.0',
        protocol: 'https'
      });
      github.authenticate({
        type: 'oauth',
        token: token
      });
      return github;
    },
    getFilteredSettings: function() {
      var blacklistedKey, blacklistedKeys, j, len, ref1, settings;
      settings = JSON.parse(JSON.stringify(atom.config.settings));
      blacklistedKeys = REMOVE_KEYS.concat((ref1 = atom.config.get('sync-settings.blacklistedKeys')) != null ? ref1 : []);
      for (j = 0, len = blacklistedKeys.length; j < len; j++) {
        blacklistedKey = blacklistedKeys[j];
        blacklistedKey = blacklistedKey.split(".");
        this._removeProperty(settings, blacklistedKey);
      }
      return JSON.stringify(settings, null, '\t');
    },
    _removeProperty: function(obj, key) {
      var currentKey, lastKey;
      lastKey = key.length === 1;
      currentKey = key.shift();
      if (!lastKey && _.isObject(obj[currentKey]) && !_.isArray(obj[currentKey])) {
        return this._removeProperty(obj[currentKey], key);
      } else {
        return delete obj[currentKey];
      }
    },
    goToPackageSettings: function() {
      return atom.workspace.open("atom://config/packages/sync-settings");
    },
    applySettings: function(pref, settings) {
      var colorKeys, isColor, key, keyPath, results, value, valueKeys;
      results = [];
      for (key in settings) {
        value = settings[key];
        keyPath = pref + "." + key;
        isColor = false;
        if (_.isObject(value)) {
          valueKeys = Object.keys(value);
          colorKeys = ['alpha', 'blue', 'green', 'red'];
          isColor = _.isEqual(_.sortBy(valueKeys), colorKeys);
        }
        if (_.isObject(value) && !_.isArray(value) && !isColor) {
          results.push(this.applySettings(keyPath, value));
        } else {
          console.debug("config.set " + keyPath.slice(1) + "=" + value);
          results.push(atom.config.set(keyPath.slice(1), value));
        }
      }
      return results;
    },
    installMissingPackages: function(packages, cb) {
      var available_package, available_packages, concurrency, failed, i, installNextPackage, j, k, len, missing_packages, notifications, p, pkg, ref1, results, succeeded;
      available_packages = this.getPackages();
      missing_packages = [];
      for (j = 0, len = packages.length; j < len; j++) {
        pkg = packages[j];
        available_package = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = available_packages.length; k < len1; k++) {
            p = available_packages[k];
            if (p.name === pkg.name) {
              results.push(p);
            }
          }
          return results;
        })();
        if (available_package.length === 0) {
          missing_packages.push(pkg);
        } else if (!(!!pkg.apmInstallSource === !!available_package[0].apmInstallSource)) {
          missing_packages.push(pkg);
        }
      }
      if (missing_packages.length === 0) {
        atom.notifications.addInfo("Sync-settings: no packages to install");
        return typeof cb === "function" ? cb() : void 0;
      }
      notifications = {};
      succeeded = [];
      failed = [];
      installNextPackage = (function(_this) {
        return function() {
          var count, failedStr, i;
          if (missing_packages.length > 0) {
            pkg = missing_packages.shift();
            i = succeeded.length + failed.length + Object.keys(notifications).length + 1;
            count = i + missing_packages.length;
            notifications[pkg.name] = atom.notifications.addInfo("Sync-settings: installing " + pkg.name + " (" + i + "/" + count + ")", {
              dismissable: true
            });
            return (function(pkg) {
              return _this.installPackage(pkg, function(error) {
                notifications[pkg.name].dismiss();
                delete notifications[pkg.name];
                if (error != null) {
                  failed.push(pkg.name);
                  atom.notifications.addWarning("Sync-settings: failed to install " + pkg.name);
                } else {
                  succeeded.push(pkg.name);
                }
                return installNextPackage();
              });
            })(pkg);
          } else if (Object.keys(notifications).length === 0) {
            if (failed.length === 0) {
              atom.notifications.addSuccess("Sync-settings: finished installing " + succeeded.length + " packages");
            } else {
              failed.sort();
              failedStr = failed.join(', ');
              atom.notifications.addWarning("Sync-settings: finished installing packages (" + failed.length + " failed: " + failedStr + ")", {
                dismissable: true
              });
            }
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this);
      concurrency = Math.min(missing_packages.length, 8);
      results = [];
      for (i = k = 0, ref1 = concurrency; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        results.push(installNextPackage());
      }
      return results;
    },
    installPackage: function(pack, cb) {
      var packageManager, type;
      type = pack.theme ? 'theme' : 'package';
      console.info("Installing " + type + " " + pack.name + "...");
      packageManager = new PackageManager();
      return packageManager.install(pack, function(error) {
        var ref1;
        if (error != null) {
          console.error("Installing " + type + " " + pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
        } else {
          console.info("Installed " + type + " " + pack.name);
        }
        return typeof cb === "function" ? cb(error) : void 0;
      });
    },
    fileContent: function(filePath) {
      var e;
      try {
        return fs.readFileSync(filePath, {
          encoding: 'utf8'
        }) || null;
      } catch (error1) {
        e = error1;
        console.error("Error reading file " + filePath + ". Probably doesn't exist.", e);
        return null;
      }
    },
    inputForkGistId: function() {
      if (ForkGistIdInputView == null) {
        ForkGistIdInputView = require('./fork-gistid-input-view');
      }
      this.inputView = new ForkGistIdInputView();
      return this.inputView.setCallbackInstance(this);
    },
    forkGistId: function(forkId) {
      return this.createClient().gists.fork({
        id: forkId
      }, (function(_this) {
        return function(err, res) {
          var SyntaxError, message;
          if (err) {
            try {
              message = JSON.parse(err.message).message;
              if (message === "Not Found") {
                message = "Gist ID Not Found";
              }
            } catch (error1) {
              SyntaxError = error1;
              message = err.message;
            }
            atom.notifications.addError("sync-settings: Error forking settings. (" + message + ")");
            return typeof cb === "function" ? cb() : void 0;
          }
          if (res.id) {
            atom.config.set("sync-settings.gistId", res.id);
            atom.notifications.addSuccess("sync-settings: Forked successfully to the new Gist ID " + res.id + " which has been saved to your config.");
          } else {
            atom.notifications.addError("sync-settings: Error forking settings");
          }
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    }
  };

  module.exports = SyncSettings;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvdGltLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MvbGliL3N5bmMtc2V0dGluZ3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQSxtSEFBQTtJQUFBOztFQUFDLGtCQUFtQixPQUFBLENBQVEsTUFBUjs7RUFDcEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBOEIsRUFBOUIsRUFBQyxrQkFBRCxFQUFZOztFQUNaLG1CQUFBLEdBQXNCOztFQUd0QixXQUFBLEdBQWM7O0VBQ2QsV0FBQSxHQUFjLENBQ1osc0JBRFksRUFFWixtQ0FGWSxFQUdaLGdDQUhZLEVBSVosK0JBSlk7O0VBT2QsWUFBQSxHQUNFO0lBQUEsTUFBQSxFQUFRLE9BQUEsQ0FBUSxpQkFBUixDQUFSO0lBRUEsUUFBQSxFQUFVLFNBQUE7YUFFUixZQUFBLENBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBRVgsY0FBQTs7WUFBQSxZQUFhLE9BQUEsQ0FBUSxRQUFSOzs7WUFDYixpQkFBa0IsT0FBQSxDQUFRLG1CQUFSOztVQUVsQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHNCQUFwQyxFQUE0RCxTQUFBO21CQUMxRCxLQUFDLENBQUEsTUFBRCxDQUFBO1VBRDBELENBQTVEO1VBRUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyx1QkFBcEMsRUFBNkQsU0FBQTttQkFDM0QsS0FBQyxDQUFBLE9BQUQsQ0FBQTtVQUQyRCxDQUE3RDtVQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsMkJBQXBDLEVBQWlFLFNBQUE7bUJBQy9ELEtBQUMsQ0FBQSxVQUFELENBQUE7VUFEK0QsQ0FBakU7VUFFQSxJQUFJLENBQUMs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QUFBLElBQUEsQ0FGRjtJQURVLENBdldaOzs7RUE0WEYsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE1WWpCIiwic291cmNlc0NvbnRlbnQiOlsiIyBpbXBvcnRzXG57QnVmZmVyZWRQcm9jZXNzfSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbltHaXRIdWJBcGksIFBhY2thZ2VNYW5hZ2VyXSA9IFtdXG5Gb3JrR2lzdElkSW5wdXRWaWV3ID0gbnVsbFxuXG4jIGNvbnN0YW50c1xuREVTQ1JJUFRJT04gPSAnQXRvbSBjb25maWd1cmF0aW9uIHN0b3JhZ2Ugb3BlcmF0ZWQgYnkgaHR0cDovL2F0b20uaW8vcGFja2FnZXMvc3luYy1zZXR0aW5ncydcblJFTU9WRV9LRVlTID0gW1xuICAnc3luYy1zZXR0aW5ncy5naXN0SWQnLFxuICAnc3luYy1zZXR0aW5ncy5wZXJzb25hbEFjY2Vzc1Rva2VuJyxcbiAgJ3N5bmMtc2V0dGluZ3MuX2FuYWx5dGljc1VzZXJJZCcsICAjIGtlZXAgbGVnYWN5IGtleSBpbiBibGFja2xpc3RcbiAgJ3N5bmMtc2V0dGluZ3MuX2xhc3RCYWNrdXBIYXNoJyxcbl1cblxuU3luY1NldHRpbmdzID1cbiAgY29uZmlnOiByZXF1aXJlKCcuL2NvbmZpZy5jb2ZmZWUnKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgICMgc3BlZWR1cCBhY3RpdmF0aW9uIGJ5IGFzeW5jIGluaXRpYWxpemluZ1xuICAgIHNldEltbWVkaWF0ZSA9PlxuICAgICAgIyBhY3R1YWwgaW5pdGlhbGl6YXRpb24gYWZ0ZXIgYXRvbSBoYXMgbG9hZGVkXG4gICAgICBHaXRIdWJBcGkgPz0gcmVxdWlyZSAnZ2l0aHViJ1xuICAgICAgUGFja2FnZU1hbmFnZXIgPz0gcmVxdWlyZSAnLi9wYWNrYWdlLW1hbmFnZXInXG5cbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsIFwic3luYy1zZXR0aW5nczpiYWNrdXBcIiwgPT5cbiAgICAgICAgQGJhY2t1cCgpXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCBcInN5bmMtc2V0dGluZ3M6cmVzdG9yZVwiLCA9PlxuICAgICAgICBAcmVzdG9yZSgpXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCBcInN5bmMtc2V0dGluZ3M6dmlldy1iYWNrdXBcIiwgPT5cbiAgICAgICAgQHZpZXdCYWNrdXAoKVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgXCJzeW5jLXNldHRpbmdzOmNoZWNrLWJhY2t1cFwiLCA9PlxuICAgICAgICBAY2hlY2tGb3JVcGRhdGUoKVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgXCJzeW5jLXNldHRpbmdzOmZvcmtcIiwgPT5cbiAgICAgICAgQGlucHV0Rm9ya0dpc3RJZCgpXG5cbiAgICAgIG1hbmRhdG9yeVNldHRpbmdzQXBwbGllZCA9IEBjaGVja01hbmRhdG9yeVNldHRpbmdzKClcbiAgICAgIEBjaGVja0ZvclVwZGF0ZSgpIGlmIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5jaGVja0ZvclVwZGF0ZWRCYWNrdXAnKSBhbmQgbWFuZGF0b3J5U2V0dGluZ3NBcHBsaWVkXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAaW5wdXRWaWV3Py5kZXN0cm95KClcblxuICBzZXJpYWxpemU6IC0+XG5cbiAgZ2V0R2lzdElkOiAtPlxuICAgIGdpc3RJZCA9IGF0b20uY29uZmlnLmdldCAnc3luYy1zZXR0aW5ncy5naXN0SWQnXG4gICAgaWYgZ2lzdElkXG4gICAgICBnaXN0SWQgPSBnaXN0SWQudHJpbSgpXG4gICAgcmV0dXJuIGdpc3RJZFxuXG4gIGdldFBlcnNvbmFsQWNjZXNzVG9rZW46IC0+XG4gICAgdG9rZW4gPSBhdG9tLmNvbmZpZy5nZXQgJ3N5bmMtc2V0dGluZ3MucGVyc29uYWxBY2Nlc3NUb2tlbidcbiAgICBpZiB0b2tlblxuICAgICAgdG9rZW4gPSB0b2tlbi50cmltKClcbiAgICByZXR1cm4gdG9rZW5cblxuICBjaGVja01hbmRhdG9yeVNldHRpbmdzOiAtPlxuICAgIG1pc3NpbmdTZXR0aW5ncyA9IFtdXG4gICAgaWYgbm90IEBnZXRHaXN0SWQoKVxuICAgICAgbWlzc2luZ1NldHRpbmdzLnB1c2goXCJHaXN0IElEXCIpXG4gICAgaWYgbm90IEBnZXRQZXJzb25hbEFjY2Vzc1Rva2VuKClcbiAgICAgIG1pc3NpbmdTZXR0aW5ncy5wdXNoKFwiR2l0SHViIHBlcnNvbmFsIGFjY2VzcyB0b2tlblwiKVxuICAgIGlmIG1pc3NpbmdTZXR0aW5ncy5sZW5ndGhcbiAgICAgIEBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3MobWlzc2luZ1NldHRpbmdzKVxuICAgIHJldHVybiBtaXNzaW5nU2V0dGluZ3MubGVuZ3RoIGlzIDBcblxuICBjaGVja0ZvclVwZGF0ZTogKGNiPW51bGwpIC0+XG4gICAgaWYgQGdldEdpc3RJZCgpXG4gICAgICBjb25zb2xlLmRlYnVnKCdjaGVja2luZyBsYXRlc3QgYmFja3VwLi4uJylcbiAgICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5nZXRcbiAgICAgICAgaWQ6IEBnZXRHaXN0SWQoKVxuICAgICAgLCAoZXJyLCByZXMpID0+XG4gICAgICAgIGlmIGVyclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IgXCJlcnJvciB3aGlsZSByZXRyaWV2aW5nIHRoZSBnaXN0LiBkb2VzIGl0IGV4aXN0cz9cIiwgZXJyXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgICAgbWVzc2FnZSA9ICdHaXN0IElEIE5vdCBGb3VuZCcgaWYgbWVzc2FnZSBpcyAnTm90IEZvdW5kJ1xuICAgICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuIChcIittZXNzYWdlK1wiKVwiXG4gICAgICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICAgICAgaWYgbm90IHJlcz8uaGlzdG9yeT9bMF0/LnZlcnNpb24/XG4gICAgICAgICAgY29uc29sZS5lcnJvciBcImNvdWxkIG5vdCBpbnRlcnByZXQgcmVzdWx0OlwiLCByZXNcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuXCJcbiAgICAgICAgICByZXR1cm4gY2I/KClcblxuICAgICAgICBjb25zb2xlLmRlYnVnKFwibGF0ZXN0IGJhY2t1cCB2ZXJzaW9uICN7cmVzLmhpc3RvcnlbMF0udmVyc2lvbn1cIilcbiAgICAgICAgaWYgcmVzLmhpc3RvcnlbMF0udmVyc2lvbiBpc250IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5fbGFzdEJhY2t1cEhhc2gnKVxuICAgICAgICAgIEBub3RpZnlOZXdlckJhY2t1cCgpXG4gICAgICAgIGVsc2UgaWYgbm90IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5xdWlldFVwZGF0ZUNoZWNrJylcbiAgICAgICAgICBAbm90aWZ5QmFja3VwVXB0b2RhdGUoKVxuXG4gICAgICAgIGNiPygpXG4gICAgZWxzZVxuICAgICAgQG5vdGlmeU1pc3NpbmdNYW5kYXRvcnlTZXR0aW5ncyhbXCJHaXN0IElEXCJdKVxuXG4gIG5vdGlmeU5ld2VyQmFja3VwOiAtPlxuICAgICMgd2UgbmVlZCB0aGUgYWN0dWFsIGVsZW1lbnQgZm9yIGRpc3BhdGNoaW5nIG9uIGl0XG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcInN5bmMtc2V0dGluZ3M6IFlvdXIgc2V0dGluZ3MgYXJlIG91dCBvZiBkYXRlLlwiLFxuICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgIHRleHQ6IFwiQmFja3VwXCJcbiAgICAgICAgb25EaWRDbGljazogLT5cbiAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsIFwic3luYy1zZXR0aW5nczpiYWNrdXBcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJWaWV3IGJhY2t1cFwiXG4gICAgICAgIG9uRGlkQ2xpY2s6IC0+XG4gICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCBcInN5bmMtc2V0dGluZ3M6dmlldy1iYWNrdXBcIlxuICAgICAgfSwge1xuICAgICAgICB0ZXh0OiBcIlJlc3RvcmVcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgXCJzeW5jLXNldHRpbmdzOnJlc3RvcmVcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJEaXNtaXNzXCJcbiAgICAgICAgb25EaWRDbGljazogLT4gbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgfV1cblxuICBub3RpZnlCYWNrdXBVcHRvZGF0ZTogLT5cbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IExhdGVzdCBiYWNrdXAgaXMgYWxyZWFkeSBhcHBsaWVkLlwiXG5cblxuICBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3M6IChtaXNzaW5nU2V0dGluZ3MpIC0+XG4gICAgY29udGV4dCA9IHRoaXNcbiAgICBlcnJvck1zZyA9IFwic3luYy1zZXR0aW5nczogTWFuZGF0b3J5IHNldHRpbmdzIG1pc3Npbmc6IFwiICsgbWlzc2luZ1NldHRpbmdzLmpvaW4oJywgJylcblxuICAgIG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnJvck1zZyxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICBidXR0b25zOiBbe1xuICAgICAgICB0ZXh0OiBcIlBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgICAgY29udGV4dC5nb1RvUGFja2FnZVNldHRpbmdzKClcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH1dXG5cbiAgYmFja3VwOiAoY2I9bnVsbCkgLT5cbiAgICBmaWxlcyA9IHt9XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTZXR0aW5ncycpXG4gICAgICBmaWxlc1tcInNldHRpbmdzLmpzb25cIl0gPSBjb250ZW50OiBAZ2V0RmlsdGVyZWRTZXR0aW5ncygpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNQYWNrYWdlcycpXG4gICAgICBmaWxlc1tcInBhY2thZ2VzLmpzb25cIl0gPSBjb250ZW50OiBKU09OLnN0cmluZ2lmeShAZ2V0UGFja2FnZXMoKSwgbnVsbCwgJ1xcdCcpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNLZXltYXAnKVxuICAgICAgZmlsZXNbXCJrZXltYXAuY3NvblwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5rZXltYXBzLmdldFVzZXJLZXltYXBQYXRoKCkpID8gXCIjIGtleW1hcCBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1N0eWxlcycpXG4gICAgICBmaWxlc1tcInN0eWxlcy5sZXNzXCJdID0gY29udGVudDogKEBmaWxlQ29udGVudCBhdG9tLnN0eWxlcy5nZXRVc2VyU3R5bGVTaGVldFBhdGgoKSkgPyBcIi8vIHN0eWxlcyBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuICAgICAgZmlsZXNbXCJpbml0LmNvZmZlZVwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5jb25maWcuY29uZmlnRGlyUGF0aCArIFwiL2luaXQuY29mZmVlXCIpID8gXCIjIGluaXRpYWxpemF0aW9uIGZpbGUgKG5vdCBmb3VuZClcIlxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5zeW5jU25pcHBldHMnKVxuICAgICAgZmlsZXNbXCJzbmlwcGV0cy5jc29uXCJdID0gY29udGVudDogKEBmaWxlQ29udGVudCBhdG9tLmNvbmZpZy5jb25maWdEaXJQYXRoICsgXCIvc25pcHBldHMuY3NvblwiKSA/IFwiIyBzbmlwcGV0cyBmaWxlIChub3QgZm91bmQpXCJcblxuICAgIGZvciBmaWxlIGluIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5leHRyYUZpbGVzJykgPyBbXVxuICAgICAgZXh0ID0gZmlsZS5zbGljZShmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSkudG9Mb3dlckNhc2UoKVxuICAgICAgY210c3RhcnQgPSBcIiNcIlxuICAgICAgY210c3RhcnQgPSBcIi8vXCIgaWYgZXh0IGluIFtcIi5sZXNzXCIsIFwiLnNjc3NcIiwgXCIuanNcIl1cbiAgICAgIGNtdHN0YXJ0ID0gXCIvKlwiIGlmIGV4dCBpbiBbXCIuY3NzXCJdXG4gICAgICBjbXRlbmQgPSBcIlwiXG4gICAgICBjbXRlbmQgPSBcIiovXCIgaWYgZXh0IGluIFtcIi5jc3NcIl1cbiAgICAgIGZpbGVzW2ZpbGVdID1cbiAgICAgICAgY29udGVudDogKEBmaWxlQ29udGVudCBhdG9tLmNvbmZpZy5jb25maWdEaXJQYXRoICsgXCIvI3tmaWxlfVwiKSA/IFwiI3tjbXRzdGFydH0gI3tmaWxlfSAobm90IGZvdW5kKSAje2NtdGVuZH1cIlxuXG4gICAgQGNyZWF0ZUNsaWVudCgpLmdpc3RzLmVkaXRcbiAgICAgIGlkOiBAZ2V0R2lzdElkKClcbiAgICAgIGRlc2NyaXB0aW9uOiBhdG9tLmNvbmZpZy5nZXQgJ3N5bmMtc2V0dGluZ3MuZ2lzdERlc2NyaXB0aW9uJ1xuICAgICAgZmlsZXM6IGZpbGVzXG4gICAgLCAoZXJyLCByZXMpIC0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgY29uc29sZS5lcnJvciBcImVycm9yIGJhY2tpbmcgdXAgZGF0YTogXCIrZXJyLm1lc3NhZ2UsIGVyclxuICAgICAgICB0cnlcbiAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgIG1lc3NhZ2UgPSAnR2lzdCBJRCBOb3QgRm91bmQnIGlmIG1lc3NhZ2UgaXMgJ05vdCBGb3VuZCdcbiAgICAgICAgY2F0Y2ggU3ludGF4RXJyb3JcbiAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwic3luYy1zZXR0aW5nczogRXJyb3IgYmFja2luZyB1cCB5b3VyIHNldHRpbmdzLiAoXCIrbWVzc2FnZStcIilcIlxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3N5bmMtc2V0dGluZ3MuX2xhc3RCYWNrdXBIYXNoJywgcmVzLmhpc3RvcnlbMF0udmVyc2lvbilcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgXCJzeW5jLXNldHRpbmdzOiBZb3VyIHNldHRpbmdzIHdlcmUgc3VjY2Vzc2Z1bGx5IGJhY2tlZCB1cC4gPGJyLz48YSBocmVmPSdcIityZXMuaHRtbF91cmwrXCInPkNsaWNrIGhlcmUgdG8gb3BlbiB5b3VyIEdpc3QuPC9hPlwiXG4gICAgICBjYj8oZXJyLCByZXMpXG5cbiAgdmlld0JhY2t1cDogLT5cbiAgICBTaGVsbCA9IHJlcXVpcmUgJ3NoZWxsJ1xuICAgIGdpc3RJZCA9IEBnZXRHaXN0SWQoKVxuICAgIFNoZWxsLm9wZW5FeHRlcm5hbCBcImh0dHBzOi8vZ2lzdC5naXRodWIuY29tLyN7Z2lzdElkfVwiXG5cbiAgZ2V0UGFja2FnZXM6IC0+XG4gICAgcGFja2FnZXMgPSBbXVxuICAgIGZvciBpLCBtZXRhZGF0YSBvZiBAX2dldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YVdpdGhvdXREdXBsaWNhdGVzKClcbiAgICAgIHtuYW1lLCB2ZXJzaW9uLCB0aGVtZSwgYXBtSW5zdGFsbFNvdXJjZX0gPSBtZXRhZGF0YVxuICAgICAgcGFja2FnZXMucHVzaCh7bmFtZSwgdmVyc2lvbiwgdGhlbWUsIGFwbUluc3RhbGxTb3VyY2V9KVxuICAgIF8uc29ydEJ5KHBhY2thZ2VzLCAnbmFtZScpXG5cbiAgX2dldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YVdpdGhvdXREdXBsaWNhdGVzOiAtPlxuICAgIHBhdGgybWV0YWRhdGEgPSB7fVxuICAgIHBhY2thZ2VfbWV0YWRhdGEgPSBhdG9tLnBhY2thZ2VzLmdldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YSgpXG4gICAgZm9yIHBhdGgsIGkgaW4gYXRvbS5wYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlUGF0aHMoKVxuICAgICAgcGF0aDJtZXRhZGF0YVtmcy5yZWFscGF0aFN5bmMocGF0aCldID0gcGFja2FnZV9tZXRhZGF0YVtpXVxuXG4gICAgcGFja2FnZXMgPSBbXVxuICAgIGZvciBpLCBwa2dfbmFtZSBvZiBhdG9tLnBhY2thZ2VzLmdldEF2YWlsYWJsZVBhY2thZ2VOYW1lcygpXG4gICAgICBwa2dfcGF0aCA9IGF0b20ucGFja2FnZXMucmVzb2x2ZVBhY2thZ2VQYXRoKHBrZ19uYW1lKVxuICAgICAgaWYgcGF0aDJtZXRhZGF0YVtwa2dfcGF0aF1cbiAgICAgICAgcGFja2FnZXMucHVzaChwYXRoMm1ldGFkYXRhW3BrZ19wYXRoXSlcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5lcnJvcignY291bGQgbm90IGNvcnJlbGF0ZSBwYWNrYWdlIG5hbWUsIHBhdGgsIGFuZCBtZXRhZGF0YScpXG4gICAgcGFja2FnZXNcblxuICByZXN0b3JlOiAoY2I9bnVsbCkgLT5cbiAgICBAY3JlYXRlQ2xpZW50KCkuZ2lzdHMuZ2V0XG4gICAgICBpZDogQGdldEdpc3RJZCgpXG4gICAgLCAoZXJyLCByZXMpID0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgY29uc29sZS5lcnJvciBcImVycm9yIHdoaWxlIHJldHJpZXZpbmcgdGhlIGdpc3QuIGRvZXMgaXQgZXhpc3RzP1wiLCBlcnJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpLm1lc3NhZ2VcbiAgICAgICAgICBtZXNzYWdlID0gJ0dpc3QgSUQgTm90IEZvdW5kJyBpZiBtZXNzYWdlIGlzICdOb3QgRm91bmQnXG4gICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcInN5bmMtc2V0dGluZ3M6IEVycm9yIHJldHJpZXZpbmcgeW91ciBzZXR0aW5ncy4gKFwiK21lc3NhZ2UrXCIpXCJcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIGNhbGxiYWNrQXN5bmMgPSBmYWxzZVxuXG4gICAgICBmb3Igb3duIGZpbGVuYW1lLCBmaWxlIG9mIHJlcy5maWxlc1xuICAgICAgICBzd2l0Y2ggZmlsZW5hbWVcbiAgICAgICAgICB3aGVuICdzZXR0aW5ncy5qc29uJ1xuICAgICAgICAgICAgQGFwcGx5U2V0dGluZ3MgJycsIEpTT04ucGFyc2UoZmlsZS5jb250ZW50KSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1NldHRpbmdzJylcblxuICAgICAgICAgIHdoZW4gJ3BhY2thZ2VzLmpzb24nXG4gICAgICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1BhY2thZ2VzJylcbiAgICAgICAgICAgICAgY2FsbGJhY2tBc3luYyA9IHRydWVcbiAgICAgICAgICAgICAgQGluc3RhbGxNaXNzaW5nUGFja2FnZXMgSlNPTi5wYXJzZShmaWxlLmNvbnRlbnQpLCBjYlxuXG4gICAgICAgICAgd2hlbiAna2V5bWFwLmNzb24nXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20ua2V5bWFwcy5nZXRVc2VyS2V5bWFwUGF0aCgpLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNLZXltYXAnKVxuXG4gICAgICAgICAgd2hlbiAnc3R5bGVzLmxlc3MnXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uc3R5bGVzLmdldFVzZXJTdHlsZVNoZWV0UGF0aCgpLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTdHlsZXMnKVxuXG4gICAgICAgICAgd2hlbiAnaW5pdC5jb2ZmZWUnXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uY29uZmlnLmNvbmZpZ0RpclBhdGggKyBcIi9pbml0LmNvZmZlZVwiLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNJbml0JylcblxuICAgICAgICAgIHdoZW4gJ3NuaXBwZXRzLmNzb24nXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uY29uZmlnLmNvbmZpZ0RpclBhdGggKyBcIi9zbmlwcGV0cy5jc29uXCIsIGZpbGUuY29udGVudCBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1NuaXBwZXRzJylcblxuICAgICAgICAgIGVsc2UgZnMud3JpdGVGaWxlU3luYyBcIiN7YXRvbS5jb25maWcuY29uZmlnRGlyUGF0aH0vI3tmaWxlbmFtZX1cIiwgZmlsZS5jb250ZW50XG5cbiAgICAgIGF0b20uY29uZmlnLnNldCgnc3luYy1zZXR0aW5ncy5fbGFzdEJhY2t1cEhhc2gnLCByZXMuaGlzdG9yeVswXS52ZXJzaW9uKVxuXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IFlvdXIgc2V0dGluZ3Mgd2VyZSBzdWNjZXNzZnVsbHkgc3luY2hyb25pemVkLlwiXG5cbiAgICAgIGNiPygpIHVubGVzcyBjYWxsYmFja0FzeW5jXG5cbiAgY3JlYXRlQ2xpZW50OiAtPlxuICAgIHRva2VuID0gQGdldFBlcnNvbmFsQWNjZXNzVG9rZW4oKVxuICAgIGNvbnNvbGUuZGVidWcgXCJDcmVhdGluZyBHaXRIdWJBcGkgY2xpZW50IHdpdGggdG9rZW4gPSAje3Rva2VufVwiXG4gICAgZ2l0aHViID0gbmV3IEdpdEh1YkFwaVxuICAgICAgdmVyc2lvbjogJzMuMC4wJ1xuICAgICAgIyBkZWJ1ZzogdHJ1ZVxuICAgICAgcHJvdG9jb2w6ICdodHRwcydcbiAgICBnaXRodWIuYXV0aGVudGljYXRlXG4gICAgICB0eXBlOiAnb2F1dGgnXG4gICAgICB0b2tlbjogdG9rZW5cbiAgICBnaXRodWJcblxuICBnZXRGaWx0ZXJlZFNldHRpbmdzOiAtPlxuICAgICMgXy5jbG9uZSgpIGRvZXNuJ3QgZGVlcCBjbG9uZSB0aHVzIHdlIGFyZSB1c2luZyBKU09OIHBhcnNlIHRyaWNrXG4gICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0b20uY29uZmlnLnNldHRpbmdzKSlcbiAgICBibGFja2xpc3RlZEtleXMgPSBSRU1PVkVfS0VZUy5jb25jYXQoYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLmJsYWNrbGlzdGVkS2V5cycpID8gW10pXG4gICAgZm9yIGJsYWNrbGlzdGVkS2V5IGluIGJsYWNrbGlzdGVkS2V5c1xuICAgICAgYmxhY2tsaXN0ZWRLZXkgPSBibGFja2xpc3RlZEtleS5zcGxpdChcIi5cIilcbiAgICAgIEBfcmVtb3ZlUHJvcGVydHkoc2V0dGluZ3MsIGJsYWNrbGlzdGVkS2V5KVxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgJ1xcdCcpXG5cbiAgX3JlbW92ZVByb3BlcnR5OiAob2JqLCBrZXkpIC0+XG4gICAgbGFzdEtleSA9IGtleS5sZW5ndGggaXMgMVxuICAgIGN1cnJlbnRLZXkgPSBrZXkuc2hpZnQoKVxuXG4gICAgaWYgbm90IGxhc3RLZXkgYW5kIF8uaXNPYmplY3Qob2JqW2N1cnJlbnRLZXldKSBhbmQgbm90IF8uaXNBcnJheShvYmpbY3VycmVudEtleV0pXG4gICAgICBAX3JlbW92ZVByb3BlcnR5KG9ialtjdXJyZW50S2V5XSwga2V5KVxuICAgIGVsc2VcbiAgICAgIGRlbGV0ZSBvYmpbY3VycmVudEtleV1cblxuICBnb1RvUGFja2FnZVNldHRpbmdzOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3NcIilcblxuICBhcHBseVNldHRpbmdzOiAocHJlZiwgc2V0dGluZ3MpIC0+XG4gICAgZm9yIGtleSwgdmFsdWUgb2Ygc2V0dGluZ3NcbiAgICAgIGtleVBhdGggPSBcIiN7cHJlZn0uI3trZXl9XCJcbiAgICAgIGlzQ29sb3IgPSBmYWxzZVxuICAgICAgaWYgXy5pc09iamVjdCh2YWx1ZSlcbiAgICAgICAgdmFsdWVLZXlzID0gT2JqZWN0LmtleXModmFsdWUpXG4gICAgICAgIGNvbG9yS2V5cyA9IFsnYWxwaGEnLCAnYmx1ZScsICdncmVlbicsICdyZWQnXVxuICAgICAgICBpc0NvbG9yID0gXy5pc0VxdWFsKF8uc29ydEJ5KHZhbHVlS2V5cyksIGNvbG9yS2V5cylcbiAgICAgIGlmIF8uaXNPYmplY3QodmFsdWUpIGFuZCBub3QgXy5pc0FycmF5KHZhbHVlKSBhbmQgbm90IGlzQ29sb3JcbiAgICAgICAgQGFwcGx5U2V0dGluZ3Mga2V5UGF0aCwgdmFsdWVcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5kZWJ1ZyBcImNvbmZpZy5zZXQgI3trZXlQYXRoWzEuLi5dfT0je3ZhbHVlfVwiXG4gICAgICAgIGF0b20uY29uZmlnLnNldCBrZXlQYXRoWzEuLi5dLCB2YWx1ZVxuXG4gIGluc3RhbGxNaXNzaW5nUGFja2FnZXM6IChwYWNrYWdlcywgY2IpIC0+XG4gICAgYXZhaWxhYmxlX3BhY2thZ2VzID0gQGdldFBhY2thZ2VzKClcbiAgICBtaXNzaW5nX3BhY2thZ2VzID0gW11cbiAgICBmb3IgcGtnIGluIHBhY2thZ2VzXG4gICAgICBhdmFpbGFibGVfcGFja2FnZSA9IChwIGZvciBwIGluIGF2YWlsYWJsZV9wYWNrYWdlcyB3aGVuIHAubmFtZSBpcyBwa2cubmFtZSlcbiAgICAgIGlmIGF2YWlsYWJsZV9wYWNrYWdlLmxlbmd0aCBpcyAwXG4gICAgICAgICMgbWlzc2luZyBpZiBub3QgeWV0IGluc3RhbGxlZFxuICAgICAgICBtaXNzaW5nX3BhY2thZ2VzLnB1c2gocGtnKVxuICAgICAgZWxzZSBpZiBub3QoISFwa2cuYXBtSW5zdGFsbFNvdXJjZSBpcyAhIWF2YWlsYWJsZV9wYWNrYWdlWzBdLmFwbUluc3RhbGxTb3VyY2UpXG4gICAgICAgICMgb3IgaW5zdGFsbGVkIGJ1dCB3aXRoIGRpZmZlcmVudCBhcG0gaW5zdGFsbCBzb3VyY2VcbiAgICAgICAgbWlzc2luZ19wYWNrYWdlcy5wdXNoKHBrZylcbiAgICBpZiBtaXNzaW5nX3BhY2thZ2VzLmxlbmd0aCBpcyAwXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIlN5bmMtc2V0dGluZ3M6IG5vIHBhY2thZ2VzIHRvIGluc3RhbGxcIlxuICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICBub3RpZmljYXRpb25zID0ge31cbiAgICBzdWNjZWVkZWQgPSBbXVxuICAgIGZhaWxlZCA9IFtdXG4gICAgaW5zdGFsbE5leHRQYWNrYWdlID0gPT5cbiAgICAgIGlmIG1pc3NpbmdfcGFja2FnZXMubGVuZ3RoID4gMFxuICAgICAgICAjIHN0YXJ0IGluc3RhbGxpbmcgbmV4dCBwYWNrYWdlXG4gICAgICAgIHBrZyA9IG1pc3NpbmdfcGFja2FnZXMuc2hpZnQoKVxuICAgICAgICBpID0gc3VjY2VlZGVkLmxlbmd0aCArIGZhaWxlZC5sZW5ndGggKyBPYmplY3Qua2V5cyhub3RpZmljYXRpb25zKS5sZW5ndGggKyAxXG4gICAgICAgIGNvdW50ID0gaSArIG1pc3NpbmdfcGFja2FnZXMubGVuZ3RoXG4gICAgICAgIG5vdGlmaWNhdGlvbnNbcGtnLm5hbWVdID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJTeW5jLXNldHRpbmdzOiBpbnN0YWxsaW5nICN7cGtnLm5hbWV9ICgje2l9LyN7Y291bnR9KVwiLCB7ZGlzbWlzc2FibGU6IHRydWV9XG4gICAgICAgIGRvIChwa2cpID0+XG4gICAgICAgICAgQGluc3RhbGxQYWNrYWdlIHBrZywgKGVycm9yKSAtPlxuICAgICAgICAgICAgIyBpbnN0YWxsYXRpb24gb2YgcGFja2FnZSBmaW5pc2hlZFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uc1twa2cubmFtZV0uZGlzbWlzcygpXG4gICAgICAgICAgICBkZWxldGUgbm90aWZpY2F0aW9uc1twa2cubmFtZV1cbiAgICAgICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgICAgICBmYWlsZWQucHVzaChwa2cubmFtZSlcbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJTeW5jLXNldHRpbmdzOiBmYWlsZWQgdG8gaW5zdGFsbCAje3BrZy5uYW1lfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHN1Y2NlZWRlZC5wdXNoKHBrZy5uYW1lKVxuICAgICAgICAgICAgIyB0cmlnZ2VyIG5leHQgcGFja2FnZVxuICAgICAgICAgICAgaW5zdGFsbE5leHRQYWNrYWdlKClcbiAgICAgIGVsc2UgaWYgT2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubGVuZ3RoIGlzIDBcbiAgICAgICAgIyBsYXN0IHBhY2thZ2UgaW5zdGFsbGF0aW9uIGZpbmlzaGVkXG4gICAgICAgIGlmIGZhaWxlZC5sZW5ndGggaXMgMFxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgaW5zdGFsbGluZyAje3N1Y2NlZWRlZC5sZW5ndGh9IHBhY2thZ2VzXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZhaWxlZC5zb3J0KClcbiAgICAgICAgICBmYWlsZWRTdHIgPSBmYWlsZWQuam9pbignLCAnKVxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgaW5zdGFsbGluZyBwYWNrYWdlcyAoI3tmYWlsZWQubGVuZ3RofSBmYWlsZWQ6ICN7ZmFpbGVkU3RyfSlcIiwge2Rpc21pc3NhYmxlOiB0cnVlfVxuICAgICAgICBjYj8oKVxuICAgICMgc3RhcnQgYXMgbWFueSBwYWNrYWdlIGluc3RhbGxhdGlvbnMgaW4gcGFyYWxsZWwgYXMgZGVzaXJlZFxuICAgIGNvbmN1cnJlbmN5ID0gTWF0aC5taW4gbWlzc2luZ19wYWNrYWdlcy5sZW5ndGgsIDhcbiAgICBmb3IgaSBpbiBbMC4uLmNvbmN1cnJlbmN5XVxuICAgICAgaW5zdGFsbE5leHRQYWNrYWdlKClcblxuICBpbnN0YWxsUGFja2FnZTogKHBhY2ssIGNiKSAtPlxuICAgIHR5cGUgPSBpZiBwYWNrLnRoZW1lIHRoZW4gJ3RoZW1lJyBlbHNlICdwYWNrYWdlJ1xuICAgIGNvbnNvbGUuaW5mbyhcIkluc3RhbGxpbmcgI3t0eXBlfSAje3BhY2submFtZX0uLi5cIilcbiAgICBwYWNrYWdlTWFuYWdlciA9IG5ldyBQYWNrYWdlTWFuYWdlcigpXG4gICAgcGFja2FnZU1hbmFnZXIuaW5zdGFsbCBwYWNrLCAoZXJyb3IpIC0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluc3RhbGxpbmcgI3t0eXBlfSAje3BhY2submFtZX0gZmFpbGVkXCIsIGVycm9yLnN0YWNrID8gZXJyb3IsIGVycm9yLnN0ZGVycilcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5pbmZvKFwiSW5zdGFsbGVkICN7dHlwZX0gI3twYWNrLm5hbWV9XCIpXG4gICAgICBjYj8oZXJyb3IpXG5cbiAgZmlsZUNvbnRlbnQ6IChmaWxlUGF0aCkgLT5cbiAgICB0cnlcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHtlbmNvZGluZzogJ3V0ZjgnfSkgb3IgbnVsbFxuICAgIGNhdGNoIGVcbiAgICAgIGNvbnNvbGUuZXJyb3IgXCJFcnJvciByZWFkaW5nIGZpbGUgI3tmaWxlUGF0aH0uIFByb2JhYmx5IGRvZXNuJ3QgZXhpc3QuXCIsIGVcbiAgICAgIG51bGxcblxuICBpbnB1dEZvcmtHaXN0SWQ6IC0+XG4gICAgRm9ya0dpc3RJZElucHV0VmlldyA/PSByZXF1aXJlICcuL2ZvcmstZ2lzdGlkLWlucHV0LXZpZXcnXG4gICAgQGlucHV0VmlldyA9IG5ldyBGb3JrR2lzdElkSW5wdXRWaWV3KClcbiAgICBAaW5wdXRWaWV3LnNldENhbGxiYWNrSW5zdGFuY2UodGhpcylcblxuICBmb3JrR2lzdElkOiAoZm9ya0lkKSAtPlxuICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5mb3JrXG4gICAgICBpZDogZm9ya0lkXG4gICAgLCAoZXJyLCByZXMpID0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpLm1lc3NhZ2VcbiAgICAgICAgICBtZXNzYWdlID0gXCJHaXN0IElEIE5vdCBGb3VuZFwiIGlmIG1lc3NhZ2UgaXMgXCJOb3QgRm91bmRcIlxuICAgICAgICBjYXRjaCBTeW50YXhFcnJvclxuICAgICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciBmb3JraW5nIHNldHRpbmdzLiAoXCIrbWVzc2FnZStcIilcIlxuICAgICAgICByZXR1cm4gY2I/KClcblxuICAgICAgaWYgcmVzLmlkXG4gICAgICAgIGF0b20uY29uZmlnLnNldCBcInN5bmMtc2V0dGluZ3MuZ2lzdElkXCIsIHJlcy5pZFxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IEZvcmtlZCBzdWNjZXNzZnVsbHkgdG8gdGhlIG5ldyBHaXN0IElEIFwiICsgcmVzLmlkICsgXCIgd2hpY2ggaGFzIGJlZW4gc2F2ZWQgdG8geW91ciBjb25maWcuXCJcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwic3luYy1zZXR0aW5nczogRXJyb3IgZm9ya2luZyBzZXR0aW5nc1wiXG5cbiAgICAgIGNiPygpXG5cbm1vZHVsZS5leHBvcnRzID0gU3luY1NldHRpbmdzXG4iXX0=
