'use strict';
(function() {

var module = angular.module('thunderpush', []);

module.provider('$thunderpush', $thunderpushProvider);

function $thunderpushProvider() {

  // Configuration
  var Configurer = {};
  Configurer.init = function(object, config) {

    object.setHost = function(newHost) {
      config.host = newHost;
      return object;
    }

    object.setKey = function(newKey) {
      config.key = newKey;
      return object;
    }

    object.setUser = function(newUser) {
      config.user = newUser;
      return object;
    }
  };

  var globalConfiguration = {};
  Configurer.init(this, globalConfiguration);

  this.$get = ['$q', function($q) {

    function createServiceForConfiguration(config) {
      var service = {
        listeners: []
      };

      function connect() {
        var deferred = $q.defer();
        var options = {
          log: false
        };

        if(config.user) options.user = config.user;

        Thunder.onSockOpen(function() {
          deferred.resolve('Sock open :)');
        });

        Thunder.onSockError(function() {
          deferred.reject('Error :(');
        });

        Thunder.onSockError(function() {
          deferred.reject('Sock closed :|');
        })

        Thunder.connect(config.host, config.key, [], options);

        service.promise = deferred.promise;

        // Attach listener
        service.promise.then(function() {

          Thunder.listen(function(data) {

            angular.forEach(service.listeners, function(listener) {

              if(angular.isFunction(listener)) {
                listener.call(this, angular.fromJson(data));
              }

            })

          });

          return;
        });

        return service;
      }

      function disconnect() {
        service.promise.then(function() {
          Thunder.disconnect();
        });

        return service;
      }

      function subscribe(channel, success, error) {
        service.promise.then(function() {
          Thunder.subscribe(channel, success, error);
        });

        return service;
      }

      function unsubscribe(channel, success, error) {
        service.promise.then(function() {
          Thunder.unsubscribe(channel, success, error);
        });

        return service;
      }

      function listen(callback) {
        service.listeners.push(callback);

        return service;
      }

      function getChannels() {
        return Thunder.channels;
      }

      Configurer.init(service, config);

      service.connect = _.bind(connect, service, null);

      service.disconnect = _.bind(disconnect, service, null);

      service.subscribe = _.bind(subscribe, service);

      service.unsubscribe = _.bind(unsubscribe, service);

      service.listen = _.bind(listen, service);

      service.getChannels = _.bind(getChannels, service, null);

      return service;
    }

    return createServiceForConfiguration(globalConfiguration);

  }];

}

})();