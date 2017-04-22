(function() {
  var BufferedProcess, Emitter, PackageManager, Q, _, semver, url;

  _ = require('underscore-plus');

  BufferedProcess = require('atom').BufferedProcess;

  Emitter = require('emissary').Emitter;

  Q = require('q');

  semver = require('semver');

  url = require('url');

  Q.stopUnhandledRejectionTracking();

  module.exports = PackageManager = (function() {
    Emitter.includeInto(PackageManager);

    function PackageManager() {
      this.packagePromises = [];
    }

    PackageManager.prototype.runCommand = function(args, callback) {
      var command, errorLines, exit, outputLines, stderr, stdout;
      command = atom.packages.getApmPath();
      outputLines = [];
      stdout = function(lines) {
        return outputLines.push(lines);
      };
      errorLines = [];
      stderr = function(lines) {
        return errorLines.push(lines);
      };
      exit = function(code) {
        return callback(code, outputLines.join('\n'), errorLines.join('\n'));
      };
      args.push('--no-color');
      return new BufferedProcess({
        command: command,
        args: args,
        stdout: stdout,
        stderr: stderr,
        exit: exit
      });
    };

    PackageManager.prototype.loadFeatured = function(callback) {
      var args, version;
      args = ['featured', '--json'];
      version = atom.getVersion();
      if (semver.valid(version)) {
        args.push('--compatible', version);
      }
      return this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, ref;
        if (code === 0) {
          try {
            packages = (ref = JSON.parse(stdout)) != null ? ref : [];
          } catch (error1) {
            error = error1;
            callback(error);
            return;
          }
          return callback(null, packages);
        } else {
          error = new Error('Fetching featured packages and themes failed.');
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
    };

    PackageManager.prototype.loadOutdated = function(callback) {
      var args, version;
      args = ['outdated', '--json'];
      version = atom.getVersion();
      if (semver.valid(version)) {
        args.push('--compatible', version);
      }
      return this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, ref;
        if (code === 0) {
          try {
            packages = (ref = JSON.parse(stdout)) != null ? ref : [];
          } catch (error1) {
            error = error1;
            callback(error);
            return;
          }
          return callback(null, packages);
        } else {
          error = new Error('Fetching outdated packages and themes failed.');
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
    };

    PackageManager.prototype.loadPackage = function(packageName, callback) {
      var args;
      args = ['view', packageName, '--json'];
      return this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, ref;
        if (code === 0) {
          try {
            packages = (ref = JSON.parse(stdout)) != null ? ref : [];
          } catch (error1) {
            error = error1;
            callback(error);
            return;
          }
          return callback(null, packages);
        } else {
          error = new Error("Fetching package '" + packageName + "' failed.");
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
    };

    PackageManager.prototype.getFeatured = function() {
      return this.featuredPromise != null ? this.featuredPromise : this.featuredPromise = Q.nbind(this.loadFeatured, this)();
    };

    PackageManager.prototype.getOutdated = function() {
      return this.outdatedPromise != null ? this.outdatedPromise : this.outdatedPromise = Q.nbind(this.loadOutdated, this)();
    };

    PackageManager.prototype.getPackage = function(packageName) {
      var base;
      return (base = this.packagePromises)[packageName] != null ? base[packageName] : base[packageName] = Q.nbind(this.loadPackage, this, packageName)();
    };

    PackageManager.prototype.search = function(query, options) {
      var args, deferred;
      if (options == null) {
        options = {};
      }
      deferred = Q.defer();
      args = ['search', query, '--json'];
      if (options.themes) {
        args.push('--themes');
      } else if (options.packages) {
        args.push('--packages');
      }
      this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, ref;
        if (code === 0) {
          try {
            packages = (ref = JSON.parse(stdout)) != null ? ref : [];
            return deferred.resolve(packages);
          } catch (error1) {
            error = error1;
            return deferred.reject(error);
          }
        } else {
          error = new Error("Searching for \u201C" + query + "\u201D failed.");
          error.stdout = stdout;
          error.stderr = stderr;
          return deferred.reject(error);
        }
      });
      return deferred.promise;
    };

    PackageManager.prototype.update = function(pack, newVersion, callback) {
      var activateOnFailure, activateOnSuccess, args, exit, name, theme;
      name = pack.name, theme = pack.theme;
      activateOnSuccess = !theme && !atom.packages.isPackageDisabled(name);
      activateOnFailure = atom.packages.isPackageActive(name);
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      if (atom.packages.isPackageLoaded(name)) {
        atom.packages.unloadPackage(name);
      }
      args = ['install', name + "@" + newVersion];
      exit = (function(_this) {
        return function(code, stdout, stderr) {
          var error;
          if (code === 0) {
            if (activateOnSuccess) {
              atom.packages.activatePackage(name);
            } else {
              atom.packages.loadPackage(name);
            }
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('updated', pack);
          } else {
            if (activateOnFailure) {
              atom.packages.activatePackage(name);
            }
            error = new Error("Updating to \u201C" + name + "@" + newVersion + "\u201D failed.");
            error.stdout = stdout;
            error.stderr = stderr;
            error.packageInstallError = !theme;
            _this.emitPackageEvent('update-failed', pack, error);
            return callback(error);
          }
        };
      })(this);
      this.emit('package-updating', pack);
      return this.runCommand(args, exit);
    };

    PackageManager.prototype.install = function(pack, callback) {
      var activateOnFailure, activateOnSuccess, apmInstallSource, args, exit, name, packageRef, theme, version;
      name = pack.name, version = pack.version, theme = pack.theme, apmInstallSource = pack.apmInstallSource;
      activateOnSuccess = !theme && !atom.packages.isPackageDisabled(name);
      activateOnFailure = atom.packages.isPackageActive(name);
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      if (atom.packages.isPackageLoaded(name)) {
        atom.packages.unloadPackage(name);
      }
      packageRef = apmInstallSource ? apmInstallSource.source : name + "@" + version;
      args = ['install', packageRef];
      exit = (function(_this) {
        return function(code, stdout, stderr) {
          var error;
          if (code === 0) {
            if (activateOnSuccess) {
              atom.packages.activatePackage(name);
            } else {
              atom.packages.loadPackage(name);
            }
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('installed', pack);
          } else {
            if (activateOnFailure) {
              atom.packages.activatePackage(name);
            }
            error = new Error("Installing \u201C" + packageRef + "\u201D failed.");
            error.stdout = stdout;
            error.stderr = stderr;
            error.packageInstallError = !theme;
            _this.emitPackageEvent('install-failed', pack, error);
            return callback(error);
          }
        };
      })(this);
      return this.runCommand(args, exit);
    };

    PackageManager.prototype.uninstall = function(pack, callback) {
      var name;
      name = pack.name;
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      return this.runCommand(['uninstall', '--hard', name], (function(_this) {
        return function(code, stdout, stderr) {
          var error;
          if (code === 0) {
            if (atom.packages.isPackageLoaded(name)) {
              atom.packages.unloadPackage(name);
            }
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('uninstalled', pack);
          } else {
            error = new Error("Uninstalling \u201C" + name + "\u201D failed.");
            error.stdout = stdout;
            error.stderr = stderr;
            _this.emitPackageEvent('uninstall-failed', pack, error);
            return callback(error);
          }
        };
      })(this));
    };

    PackageManager.prototype.canUpgrade = function(installedPackage, availableVersion) {
      var installedVersion;
      if (installedPackage == null) {
        return false;
      }
      installedVersion = installedPackage.metadata.version;
      if (!semver.valid(installedVersion)) {
        return false;
      }
      if (!semver.valid(availableVersion)) {
        return false;
      }
      return semver.gt(availableVersion, installedVersion);
    };

    PackageManager.prototype.getPackageTitle = function(arg) {
      var name;
      name = arg.name;
      return _.undasherize(_.uncamelcase(name));
    };

    PackageManager.prototype.getRepositoryUrl = function(arg) {
      var metadata, ref, ref1, repoUrl, repository;
      metadata = arg.metadata;
      repository = metadata.repository;
      repoUrl = (ref = (ref1 = repository != null ? repository.url : void 0) != null ? ref1 : repository) != null ? ref : '';
      return repoUrl.replace(/\.git$/, '').replace(/\/+$/, '');
    };

    PackageManager.prototype.getAuthorUserName = function(pack) {
      var chunks, repoName, repoUrl;
      if (!(repoUrl = this.getRepositoryUrl(pack))) {
        return null;
      }
      repoName = url.parse(repoUrl).pathname;
      chunks = repoName.match('/(.+?)/');
      return chunks != null ? chunks[1] : void 0;
    };

    PackageManager.prototype.checkNativeBuildTools = function() {
      var deferred;
      deferred = Q.defer();
      this.runCommand(['install', '--check'], function(code, stdout, stderr) {
        if (code === 0) {
          return deferred.resolve();
        } else {
          return deferred.reject(new Error());
        }
      });
      return deferred.promise;
    };

    PackageManager.prototype.emitPackageEvent = function(eventName, pack, error) {
      var ref, ref1, theme;
      theme = (ref = pack.theme) != null ? ref : (ref1 = pack.metadata) != null ? ref1.theme : void 0;
      eventName = theme ? "theme-" + eventName : "package-" + eventName;
      return this.emit(eventName, pack, error);
    };

    return PackageManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvdGltLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MvbGliL3BhY2thZ2UtbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsa0JBQW1CLE9BQUEsQ0FBUSxNQUFSOztFQUNuQixVQUFXLE9BQUEsQ0FBUSxVQUFSOztFQUNaLENBQUEsR0FBSSxPQUFBLENBQVEsR0FBUjs7RUFDSixNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBQ1QsR0FBQSxHQUFNLE9BQUEsQ0FBUSxLQUFSOztFQUVOLENBQUMsQ0FBQyw4QkFBRixDQUFBOztFQUVBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixPQUFPLENBQUMsV0FBUixDQUFvQixjQUFwQjs7SUFFYSx3QkFBQTtNQUNYLElBQUMsQ0FBQSxlQUFELEdBQW1CO0lBRFI7OzZCQUdiLFVBQUEsR0FBWSxTQUFDLElBQUQsRUFBTyxRQUFQO0FBQ1YsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQWQsQ0FBQTtNQUNWLFdBQUEsR0FBYztNQUNkLE1BQUEsR0FBUyxTQUFDLEtBQUQ7ZUFBVyxXQUFXLENBQUMsSUFBWixDQUFpQixLQUFqQjtNQUFYO01BQ1QsVUFBQSxHQUFhO01BQ2IsTUFBQSxHQUFTLFNBQUMsS0FBRDtlQUFXLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEtBQWhCO01BQVg7TUFDVCxJQUFBLEdBQU8sU0FBQyxJQUFEO2VBQ0wsUUFBQSxDQUFTLElBQVQsRUFBZSxXQUFXLENBQUMsSUFBWixDQUFpQixJQUFqQixDQUFmLEVBQXVDLFVBQVUsQ0FBQyxJQUFYLENBQWdCLElBQWhCLENBQXZDO01BREs7TUFHUCxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVY7YUFDSSxJQUFBLGVBQUEsQ0FBZ0I7UUFBQyxTQUFBLE9B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cEIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyBjb3BpZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9zZXR0aW5ncy12aWV3XG5cblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntCdWZmZXJlZFByb2Nlc3N9ID0gcmVxdWlyZSAnYXRvbSdcbntFbWl0dGVyfSA9IHJlcXVpcmUgJ2VtaXNzYXJ5J1xuUSA9IHJlcXVpcmUgJ3EnXG5zZW12ZXIgPSByZXF1aXJlICdzZW12ZXInXG51cmwgPSByZXF1aXJlICd1cmwnXG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nKClcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZU1hbmFnZXJcbiAgRW1pdHRlci5pbmNsdWRlSW50byh0aGlzKVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBwYWNrYWdlUHJvbWlzZXMgPSBbXVxuXG4gIHJ1bkNvbW1hbmQ6IChhcmdzLCBjYWxsYmFjaykgLT5cbiAgICBjb21tYW5kID0gYXRvbS5wYWNrYWdlcy5nZXRBcG1QYXRoKClcbiAgICBvdXRwdXRMaW5lcyA9IFtdXG4gICAgc3Rkb3V0ID0gKGxpbmVzKSAtPiBvdXRwdXRMaW5lcy5wdXNoKGxpbmVzKVxuICAgIGVycm9yTGluZXMgPSBbXVxuICAgIHN0ZGVyciA9IChsaW5lcykgLT4gZXJyb3JMaW5lcy5wdXNoKGxpbmVzKVxuICAgIGV4aXQgPSAoY29kZSkgLT5cbiAgICAgIGNhbGxiYWNrKGNvZGUsIG91dHB1dExpbmVzLmpvaW4oJ1xcbicpLCBlcnJvckxpbmVzLmpvaW4oJ1xcbicpKVxuXG4gICAgYXJncy5wdXNoKCctLW5vLWNvbG9yJylcbiAgICBuZXcgQnVmZmVyZWRQcm9jZXNzKHtjb21tYW5kLCBhcmdzLCBzdGRvdXQsIHN0ZGVyciwgZXhpdH0pXG5cbiAgbG9hZEZlYXR1cmVkOiAoY2FsbGJhY2spIC0+XG4gICAgYXJncyA9IFsnZmVhdHVyZWQnLCAnLS1qc29uJ11cbiAgICB2ZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKClcbiAgICBhcmdzLnB1c2goJy0tY29tcGF0aWJsZScsIHZlcnNpb24pIGlmIHNlbXZlci52YWxpZCh2ZXJzaW9uKVxuXG4gICAgQHJ1bkNvbW1hbmQgYXJncywgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VzID0gSlNPTi5wYXJzZShzdGRvdXQpID8gW11cbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICBjYWxsYmFjayhlcnJvcilcbiAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjYWxsYmFjayhudWxsLCBwYWNrYWdlcylcbiAgICAgIGVsc2VcbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0ZldGNoaW5nIGZlYXR1cmVkIHBhY2thZ2VzIGFuZCB0aGVtZXMgZmFpbGVkLicpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpXG5cbiAgbG9hZE91dGRhdGVkOiAoY2FsbGJhY2spIC0+XG4gICAgYXJncyA9IFsnb3V0ZGF0ZWQnLCAnLS1qc29uJ11cbiAgICB2ZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKClcbiAgICBhcmdzLnB1c2goJy0tY29tcGF0aWJsZScsIHZlcnNpb24pIGlmIHNlbXZlci52YWxpZCh2ZXJzaW9uKVxuXG4gICAgQHJ1bkNvbW1hbmQgYXJncywgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VzID0gSlNPTi5wYXJzZShzdGRvdXQpID8gW11cbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICBjYWxsYmFjayhlcnJvcilcbiAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjYWxsYmFjayhudWxsLCBwYWNrYWdlcylcbiAgICAgIGVsc2VcbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0ZldGNoaW5nIG91dGRhdGVkIHBhY2thZ2VzIGFuZCB0aGVtZXMgZmFpbGVkLicpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpXG5cbiAgbG9hZFBhY2thZ2U6IChwYWNrYWdlTmFtZSwgY2FsbGJhY2spIC0+XG4gICAgYXJncyA9IFsndmlldycsIHBhY2thZ2VOYW1lLCAnLS1qc29uJ11cblxuICAgIEBydW5Db21tYW5kIGFyZ3MsIChjb2RlLCBzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgIGlmIGNvZGUgaXMgMFxuICAgICAgICB0cnlcbiAgICAgICAgICBwYWNrYWdlcyA9IEpTT04ucGFyc2Uoc3Rkb3V0KSA/IFtdXG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgY2FsbGJhY2soZXJyb3IpXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcGFja2FnZXMpXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKFwiRmV0Y2hpbmcgcGFja2FnZSAnI3twYWNrYWdlTmFtZX0nIGZhaWxlZC5cIilcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBjYWxsYmFjayhlcnJvcilcblxuICBnZXRGZWF0dXJlZDogLT5cbiAgICBAZmVhdHVyZWRQcm9taXNlID89IFEubmJpbmQoQGxvYWRGZWF0dXJlZCwgdGhpcykoKVxuXG4gIGdldE91dGRhdGVkOiAtPlxuICAgIEBvdXRkYXRlZFByb21pc2UgPz0gUS5uYmluZChAbG9hZE91dGRhdGVkLCB0aGlzKSgpXG5cbiAgZ2V0UGFja2FnZTogKHBhY2thZ2VOYW1lKSAtPlxuICAgIEBwYWNrYWdlUHJvbWlzZXNbcGFja2FnZU5hbWVdID89IFEubmJpbmQoQGxvYWRQYWNrYWdlLCB0aGlzLCBwYWNrYWdlTmFtZSkoKVxuXG4gIHNlYXJjaDogKHF1ZXJ5LCBvcHRpb25zID0ge30pIC0+XG4gICAgZGVmZXJyZWQgPSBRLmRlZmVyKClcblxuICAgIGFyZ3MgPSBbJ3NlYXJjaCcsIHF1ZXJ5LCAnLS1qc29uJ11cbiAgICBpZiBvcHRpb25zLnRoZW1lc1xuICAgICAgYXJncy5wdXNoICctLXRoZW1lcydcbiAgICBlbHNlIGlmIG9wdGlvbnMucGFja2FnZXNcbiAgICAgIGFyZ3MucHVzaCAnLS1wYWNrYWdlcydcblxuICAgIEBydW5Db21tYW5kIGFyZ3MsIChjb2RlLCBzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgIGlmIGNvZGUgaXMgMFxuICAgICAgICB0cnlcbiAgICAgICAgICBwYWNrYWdlcyA9IEpTT04ucGFyc2Uoc3Rkb3V0KSA/IFtdXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWNrYWdlcylcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKFwiU2VhcmNoaW5nIGZvciBcXHUyMDFDI3txdWVyeX1cXHUyMDFEIGZhaWxlZC5cIilcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpXG5cbiAgICBkZWZlcnJlZC5wcm9taXNlXG5cbiAgdXBkYXRlOiAocGFjaywgbmV3VmVyc2lvbiwgY2FsbGJhY2spIC0+XG4gICAge25hbWUsIHRoZW1lfSA9IHBhY2tcblxuICAgIGFjdGl2YXRlT25TdWNjZXNzID0gbm90IHRoZW1lIGFuZCBub3QgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VEaXNhYmxlZChuYW1lKVxuICAgIGFjdGl2YXRlT25GYWlsdXJlID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUobmFtZSlcbiAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKG5hbWUpIGlmIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKG5hbWUpXG4gICAgYXRvbS5wYWNrYWdlcy51bmxvYWRQYWNrYWdlKG5hbWUpIGlmIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlTG9hZGVkKG5hbWUpXG5cbiAgICBhcmdzID0gWydpbnN0YWxsJywgXCIje25hbWV9QCN7bmV3VmVyc2lvbn1cIl1cbiAgICBleGl0ID0gKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIGlmIGFjdGl2YXRlT25TdWNjZXNzXG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGF0b20ucGFja2FnZXMubG9hZFBhY2thZ2UobmFtZSlcblxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAndXBkYXRlZCcsIHBhY2tcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UobmFtZSkgaWYgYWN0aXZhdGVPbkZhaWx1cmVcbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXCJVcGRhdGluZyB0byBcXHUyMDFDI3tuYW1lfUAje25ld1ZlcnNpb259XFx1MjAxRCBmYWlsZWQuXCIpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgZXJyb3IucGFja2FnZUluc3RhbGxFcnJvciA9IG5vdCB0aGVtZVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAndXBkYXRlLWZhaWxlZCcsIHBhY2ssIGVycm9yXG4gICAgICAgIGNhbGxiYWNrKGVycm9yKVxuXG4gICAgQGVtaXQoJ3BhY2thZ2UtdXBkYXRpbmcnLCBwYWNrKVxuICAgIEBydW5Db21tYW5kKGFyZ3MsIGV4aXQpXG5cbiAgaW5zdGFsbDogKHBhY2ssIGNhbGxiYWNrKSAtPlxuICAgIHtuYW1lLCB2ZXJzaW9uLCB0aGVtZSwgYXBtSW5zdGFsbFNvdXJjZX0gPSBwYWNrXG4gICAgYWN0aXZhdGVPblN1Y2Nlc3MgPSBub3QgdGhlbWUgYW5kIG5vdCBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZURpc2FibGVkKG5hbWUpXG4gICAgYWN0aXZhdGVPbkZhaWx1cmUgPSBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShuYW1lKVxuICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UobmFtZSkgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUobmFtZSlcbiAgICBhdG9tLnBhY2thZ2VzLnVubG9hZFBhY2thZ2UobmFtZSkgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VMb2FkZWQobmFtZSlcblxuICAgIHBhY2thZ2VSZWYgPVxuICAgICAgaWYgYXBtSW5zdGFsbFNvdXJjZSB0aGVuIGFwbUluc3RhbGxTb3VyY2Uuc291cmNlXG4gICAgICBlbHNlIFwiI3tuYW1lfUAje3ZlcnNpb259XCJcbiAgICBhcmdzID0gWydpbnN0YWxsJywgcGFja2FnZVJlZl1cbiAgICBleGl0ID0gKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIGlmIGFjdGl2YXRlT25TdWNjZXNzXG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGF0b20ucGFja2FnZXMubG9hZFBhY2thZ2UobmFtZSlcblxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAnaW5zdGFsbGVkJywgcGFja1xuICAgICAgZWxzZVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZShuYW1lKSBpZiBhY3RpdmF0ZU9uRmFpbHVyZVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihcIkluc3RhbGxpbmcgXFx1MjAxQyN7cGFja2FnZVJlZn1cXHUyMDFEIGZhaWxlZC5cIilcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBlcnJvci5wYWNrYWdlSW5zdGFsbEVycm9yID0gbm90IHRoZW1lXG4gICAgICAgIEBlbWl0UGFja2FnZUV2ZW50ICdpbnN0YWxsLWZhaWxlZCcsIHBhY2ssIGVycm9yXG4gICAgICAgIGNhbGxiYWNrKGVycm9yKVxuXG4gICAgQHJ1bkNvbW1hbmQoYXJncywgZXhpdClcblxuICB1bmluc3RhbGw6IChwYWNrLCBjYWxsYmFjaykgLT5cbiAgICB7bmFtZX0gPSBwYWNrXG5cbiAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKG5hbWUpIGlmIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKG5hbWUpXG5cbiAgICBAcnVuQ29tbWFuZCBbJ3VuaW5zdGFsbCcsICctLWhhcmQnLCBuYW1lXSwgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZShuYW1lKSBpZiBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUxvYWRlZChuYW1lKVxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAndW5pbnN0YWxsZWQnLCBwYWNrXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKFwiVW5pbnN0YWxsaW5nIFxcdTIwMUMje25hbWV9XFx1MjAxRCBmYWlsZWQuXCIpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgQGVtaXRQYWNrYWdlRXZlbnQgJ3VuaW5zdGFsbC1mYWlsZWQnLCBwYWNrLCBlcnJvclxuICAgICAgICBjYWxsYmFjayhlcnJvcilcblxuICBjYW5VcGdyYWRlOiAoaW5zdGFsbGVkUGFja2FnZSwgYXZhaWxhYmxlVmVyc2lvbikgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGluc3RhbGxlZFBhY2thZ2U/XG5cbiAgICBpbnN0YWxsZWRWZXJzaW9uID0gaW5zdGFsbGVkUGFja2FnZS5tZXRhZGF0YS52ZXJzaW9uXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBzZW12ZXIudmFsaWQoaW5zdGFsbGVkVmVyc2lvbilcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHNlbXZlci52YWxpZChhdmFpbGFibGVWZXJzaW9uKVxuXG4gICAgc2VtdmVyLmd0KGF2YWlsYWJsZVZlcnNpb24sIGluc3RhbGxlZFZlcnNpb24pXG5cbiAgZ2V0UGFja2FnZVRpdGxlOiAoe25hbWV9KSAtPlxuICAgIF8udW5kYXNoZXJpemUoXy51bmNhbWVsY2FzZShuYW1lKSlcblxuICBnZXRSZXBvc2l0b3J5VXJsOiAoe21ldGFkYXRhfSkgLT5cbiAgICB7cmVwb3NpdG9yeX0gPSBtZXRhZGF0YVxuICAgIHJlcG9VcmwgPSByZXBvc2l0b3J5Py51cmwgPyByZXBvc2l0b3J5ID8gJydcbiAgICByZXBvVXJsLnJlcGxhY2UoL1xcLmdpdCQvLCAnJykucmVwbGFjZSgvXFwvKyQvLCAnJylcblxuICBnZXRBdXRob3JVc2VyTmFtZTogKHBhY2spIC0+XG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHJlcG9VcmwgPSBAZ2V0UmVwb3NpdG9yeVVybChwYWNrKVxuICAgIHJlcG9OYW1lID0gdXJsLnBhcnNlKHJlcG9VcmwpLnBhdGhuYW1lXG4gICAgY2h1bmtzID0gcmVwb05hbWUubWF0Y2ggJy8oLis/KS8nXG4gICAgY2h1bmtzP1sxXVxuXG4gIGNoZWNrTmF0aXZlQnVpbGRUb29sczogLT5cbiAgICBkZWZlcnJlZCA9IFEuZGVmZXIoKVxuXG4gICAgQHJ1bkNvbW1hbmQgWydpbnN0YWxsJywgJy0tY2hlY2snXSwgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoKVxuICAgICAgZWxzZVxuICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKCkpXG5cbiAgICBkZWZlcnJlZC5wcm9taXNlXG5cbiAgIyBFbWl0cyB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgZm9yIHRoZSBnaXZlbiBwYWNrYWdlLlxuICAjXG4gICMgQWxsIGV2ZW50cyBhcmUgZWl0aGVyIG9mIHRoZSBmb3JtIGB0aGVtZS1mb29gIG9yIGBwYWNrYWdlLWZvb2AgZGVwZW5kaW5nIG9uXG4gICMgd2hldGhlciB0aGUgZXZlbnQgaXMgZm9yIGEgdGhlbWUgb3IgYSBub3JtYWwgcGFja2FnZS4gVGhpcyBtZXRob2Qgc3RhbmRhcmRpemVzXG4gICMgdGhlIGxvZ2ljIHRvIGRldGVybWluZSBpZiBhIHBhY2thZ2UgaXMgYSB0aGVtZSBvciBub3QgYW5kIGZvcm1hdHMgdGhlIGV2ZW50XG4gICMgbmFtZSBhcHByb3ByaWF0ZWx5LlxuICAjXG4gICMgZXZlbnROYW1lIC0gVGhlIGV2ZW50IG5hbWUgc3VmZml4IHtTdHJpbmd9IG9mIHRoZSBldmVudCB0byBlbWl0LlxuICAjIHBhY2sgLSBUaGUgcGFja2FnZSBmb3Igd2hpY2ggdGhlIGV2ZW50IGlzIGJlaW5nIGVtaXR0ZWQuXG4gICMgZXJyb3IgLSBBbnkgZXJyb3IgaW5mb3JtYXRpb24gdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGNhc2Ugb2YgYW4gZXJyb3IuXG4gIGVtaXRQYWNrYWdlRXZlbnQ6IChldmVudE5hbWUsIHBhY2ssIGVycm9yKSAtPlxuICAgIHRoZW1lID0gcGFjay50aGVtZSA/IHBhY2subWV0YWRhdGE/LnRoZW1lXG4gICAgZXZlbnROYW1lID0gaWYgdGhlbWUgdGhlbiBcInRoZW1lLSN7ZXZlbnROYW1lfVwiIGVsc2UgXCJwYWNrYWdlLSN7ZXZlbnROYW1lfVwiXG4gICAgQGVtaXQgZXZlbnROYW1lLCBwYWNrLCBlcnJvclxuIl19
