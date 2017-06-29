(function() {
  module.exports = {
    personalAccessToken: {
      description: 'Your personal GitHub access token',
      type: 'string',
      "default": '',
      order: 1
    },
    gistId: {
      description: 'ID of gist to use for configuration storage',
      type: 'string',
      "default": '',
      order: 2
    },
    gistDescription: {
      description: 'The description of the gist',
      type: 'string',
      "default": 'automatic update by http://atom.io/packages/sync-settings',
      order: 3
    },
    syncSettings: {
      type: 'boolean',
      "default": true,
      order: 4
    },
    blacklistedKeys: {
      description: "Comma-seperated list of blacklisted keys (e.g. 'package-name,other-package-name.config-name')",
      type: 'array',
      "default": [],
      items: {
        type: 'string'
      },
      order: 5
    },
    syncPackages: {
      type: 'boolean',
      "default": true,
      order: 6
    },
    syncKeymap: {
      type: 'boolean',
      "default": true,
      order: 7
    },
    syncStyles: {
      type: 'boolean',
      "default": true,
      order: 8
    },
    syncInit: {
      type: 'boolean',
      "default": true,
      order: 9
    },
    syncSnippets: {
      type: 'boolean',
      "default": true,
      order: 10
    },
    extraFiles: {
      description: 'Comma-seperated list of files other than Atom\'s default config files in ~/.atom',
      type: 'array',
      "default": [],
      items: {
        type: 'string'
      },
      order: 11
    },
    checkForUpdatedBackup: {
      description: 'Check for newer backup on Atom start',
      type: 'boolean',
      "default": true,
      order: 12
    },
    _lastBackupHash: {
      type: 'string',
      "default": '',
      description: 'Hash of the last backup restored or created',
      order: 13
    },
    quietUpdateCheck: {
      type: 'boolean',
      "default": false,
      description: "Mute 'Latest backup is already applied' message",
      order: 14
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvdGltLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MvbGliL2NvbmZpZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLG1CQUFBLEVBQ0U7TUFBQSxXQUFBLEVBQWEsbUNBQWI7TUFDQSxJQUFBLEVBQU0sUUFETjtNQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFGVDtNQUdBLEtBQUEsRUFBTyxDQUhQO0tBRmE7SUFNZixNQUFBLEVBQ0U7TUFBQSxXQUFBLEVBQWEsNkNBQWI7TUFDQSxJQUFBLEVBQU0sUUFETjtNQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFGVDtNQUdBLEtBQUEsRUFBTyxDQUhQO0tBUGE7SUFXZixlQUFBLEVBQ0U7TUFBQSxXQUFBLEVBQWEsNkJBQWI7TUFDQSxJQUFBLEVBQU0sUUFETjtNQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsMkRBRlQ7TUFHQSxLQUFBLEVBQU8sQ0FIUDtLQVphO0lBZ0JmLFlBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxTQUFOO01BQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO01BRUEsS0FBQSxFQUFPLENBRlA7S0FqQmE7SUFvQmYsZUFBQSxFQUNFO01BQUEsV0FBQSxFQUFhLCtGQUFiO01BQ0EsSUFBQSxFQUFNLE9BRE47TUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRlQ7TUFHQSxLQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtPQUpGO01BS0EsS0FBQSxFQUFPLENBTFA7S0FyQmE7SUEyQmYsWUFBQSxFQUNFO01BQUEsSUFBQSxFQUFNLFNBQU47TUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7TUFFQSxLQUFBLEVBQU8sQ0FGUDtLQTVCYTtJQStCZixVQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sU0FBTjtNQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtNQUVBLEtBQUEsRUFBTyxDQUZQO0tBaENhO0lBbUNmLFVBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxTQUFOO01BQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO01BRUEsS0FBQSxFQUFPLENBRlA7S0FwQ2E7SUF1Q2YsUUFBQSxFQUNFO01BQUEsSUFBQSxFQUFNLFNBQU47TUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7TUFFQSxLQUFBLEVBQU8sQ0FGUDtLQXhDYTtJQTJDZixZQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sU0FBTjtNQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtNQUVBLEtBQUEsRUFBTyxFQUZQO0tBNUNhO0lBK0NmLFVBQUEsRUFDRTtNQUFBLFdBQUEsRUFBYSxrRkFBYjtNQUNBLElBQUEsRUFBTSxPQUROO01BRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUZUO01BR0EsS0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47T0FKRjtNQUtBLEtBQUEsRUFBTyxFQUxQO0tBaERhO0lBc0RmLHFCQUFBLEVBQ0U7TUFBQSxXQUFBLEVBQWEsc0NBQWI7TUFDQSxJQUFBLEVBQU0sU0FETjtNQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFGVDtNQUdBLEtBQUEsRUFBTyxFQUhQO0tBdkRhO0lBMkRmLGVBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxRQUFOO01BQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQURUO01BRUEsV0FBQSxFQUFhLDZDQUZiO01BR0EsS0FBQSxFQUFPLEVBSFA7S0E1RGE7SUFnRWYsZ0JBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxTQUFOO01BQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO01BRUEsV0FBQSxFQUFhLGlEQUZiO01BR0EsS0FBQSxFQUFPLEVBSFA7S0FqRWE7O0FBQWpCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBlcnNvbmFsQWNjZXNzVG9rZW46XG4gICAgZGVzY3JpcHRpb246ICdZb3VyIHBlcnNvbmFsIEdpdEh1YiBhY2Nlc3MgdG9rZW4nXG4gICAgdHlwZTogJ3N0cmluZydcbiAgICBkZWZhdWx0OiAnJ1xuICAgIG9yZGVyOiAxXG4gIGdpc3RJZDpcbiAgICBkZXNjcmlwdGlvbjogJ0lEIG9mIGdpc3QgdG8gdXNlIGZvciBjb25maWd1cmF0aW9uIHN0b3JhZ2UnXG4gICAgdHlwZTogJ3N0cmluZydcbiAgICBkZWZhdWx0OiAnJ1xuICAgIG9yZGVyOiAyXG4gIGdpc3REZXNjcmlwdGlvbjpcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBkZXNjcmlwdGlvbiBvZiB0aGUgZ2lzdCdcbiAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlZmF1bHQ6ICdhdXRvbWF0aWMgdXBkYXRlIGJ5IGh0dHA6Ly9hdG9tLmlvL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MnXG4gICAgb3JkZXI6IDNcbiAgc3luY1NldHRpbmdzOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IHRydWVcbiAgICBvcmRlcjogNFxuICBibGFja2xpc3RlZEtleXM6XG4gICAgZGVzY3JpcHRpb246IFwiQ29tbWEtc2VwZXJhdGVkIGxpc3Qgb2YgYmxhY2tsaXN0ZWQga2V5cyAoZS5nLiAncGFja2FnZS1uYW1lLG90aGVyLXBhY2thZ2UtbmFtZS5jb25maWctbmFtZScpXCJcbiAgICB0eXBlOiAnYXJyYXknXG4gICAgZGVmYXVsdDogW11cbiAgICBpdGVtczpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgb3JkZXI6IDVcbiAgc3luY1BhY2thZ2VzOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IHRydWVcbiAgICBvcmRlcjogNlxuICBzeW5jS2V5bWFwOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IHRydWVcbiAgICBvcmRlcjogN1xuICBzeW5jU3R5bGVzOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IHRydWVcbiAgICBvcmRlcjogOFxuICBzeW5jSW5pdDpcbiAgICB0eXBlOiAnYm9vbGVhbidcbiAgICBkZWZhdWx0OiB0cnVlXG4gICAgb3JkZXI6IDlcbiAgc3luY1NuaXBwZXRzOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IHRydWVcbiAgICBvcmRlcjogMTBcbiAgZXh0cmFGaWxlczpcbiAgICBkZXNjcmlwdGlvbjogJ0NvbW1hLXNlcGVyYXRlZCBsaXN0IG9mIGZpbGVzIG90aGVyIHRoYW4gQXRvbVxcJ3MgZGVmYXVsdCBjb25maWcgZmlsZXMgaW4gfi8uYXRvbSdcbiAgICB0eXBlOiAnYXJyYXknXG4gICAgZGVmYXVsdDogW11cbiAgICBpdGVtczpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgb3JkZXI6IDExXG4gIGNoZWNrRm9yVXBkYXRlZEJhY2t1cDpcbiAgICBkZXNjcmlwdGlvbjogJ0NoZWNrIGZvciBuZXdlciBiYWNrdXAgb24gQXRvbSBzdGFydCdcbiAgICB0eXBlOiAnYm9vbGVhbidcbiAgICBkZWZhdWx0OiB0cnVlXG4gICAgb3JkZXI6IDEyXG4gIF9sYXN0QmFja3VwSGFzaDpcbiAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlZmF1bHQ6ICcnXG4gICAgZGVzY3JpcHRpb246ICdIYXNoIG9mIHRoZSBsYXN0IGJhY2t1cCByZXN0b3JlZCBvciBjcmVhdGVkJ1xuICAgIG9yZGVyOiAxM1xuICBxdWlldFVwZGF0ZUNoZWNrOlxuICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgZGVzY3JpcHRpb246IFwiTXV0ZSAnTGF0ZXN0IGJhY2t1cCBpcyBhbHJlYWR5IGFwcGxpZWQnIG1lc3NhZ2VcIlxuICAgIG9yZGVyOiAxNFxufVxuIl19
