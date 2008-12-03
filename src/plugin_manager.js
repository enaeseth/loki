#import "version.js"

// Package: Loki.PluginManager
// Tracks Loki plugins and is responsible for loading them. Plugin authors
// should not need to use anything in this package; your plugin is automatically
// registered by <Loki.Plugin.create>.
Loki.PluginManager = {
	// var: ({String => Object}) plugins
	// Stores information about known-available plugins.
	plugins: {},
	
	_loadTasks: {},
	_chooser: new Loki.Chooser(),
	_watchers: {},
	
	// Method: register
	// Registers a plugin with Loki. Any function that have been added as
	// watchers of the plugin's registration (see Loki.PluginManager.watch) will
	// be invoked.
	//
	// Parameters:
	//     (Object) plugin - Plugin specification. This method adds properties
	//                       to the specification object; if the caller needs a
	//                       "pure" copy, the object should first be cloned.
	register: function register_loki_plugin(plugin) {
		var pm = Loki.PluginManager, nl = Loki.Locale.getNative();
		
		plugin.dependencies = (plugin.depends)
			? pm._parseDependencies(plugin.id, plugin.depends)
			: {};

		pm.plugins[plugin.id] = plugin;
		pm._chooser.add(plugin.id, plugin);
		
		if (plugin.sets) {
			if (typeof(plugin.sets) == "string")
				plugin.sets = plugin.sets.split(/\s*,\s*/);
			
			base2.forEach(plugin.sets, function(set) {
				pm.addToSet(set, plugin.id);
			});
			
			delete plugin.sets;
		}
		
		plugin.locales = {};
		plugin.locales[nl.code] = true;
		
		if (nl.parent && nl.parent !== nl)
			plugin.locales[nl.parent.code] = true;
		
		if (pm._watchers[plugin.id]) {
			base2.forEach(pm._watchers[plugin.id], function call_watcher(w) {
				w(plugin);
			});
			
			delete pm._watchers[plugin.id];
		}
	},
	
	// Method: addToSet
	// Adds a plugin to a plugin set. Sets of plugins may be requested by name
	// as if they were a single plugin.
	//
	// Parameters:
	//     (String) set - the name of the set to which the plugin will be added
	//     (String) plugin_id - the ID of the plugin to add to the set
	addToSet: function add_plugin_to_set(set, plugin_id) {
		Loki.PluginManager._chooser.putSet(set, [plugin_id]);
	},
	
	// Method: load
	// Loads Loki plugins.
	// 
	// The following things happen during the load process:
	//  - Plugins that were requested but have not yet been loaded are loaded.
	//  - Plugins' dependencies are evaluated. Depended-upon plugins that have
	//    not yet been loaded are also loaded.
	//  - Localized string files for plugins that have not yet been loaded for
	//    the given locale are also loaded.
	//
	// After loading completes, the given callback function is called with two
	// arguments:
	//  - The first argument contains plugins that were successfully loaded.
	//    It is an object mapping plugin ID's to their implementing classes.
	//    The classes can be instantiated for use by an editor by passing a 
	//    reference to the editor to the constructor.
	//  - The second argument contains plugins that could not be loaded.
	//    It is an object mapping plugin ID's to <Loki.Notice> objects
	//    explaining why their respective plugins could not be loaded.
	//
	// Parameters:
	//     (String) selector - The plugin selector string. See the documentation
	//              for <Loki.Chooser.get> for information on its format.
	//     (Loki.Locale) locale - The locale in which the plugins will be used.
	//                   (A locale code string is also acceptable.)
	//     (Function) callback - The function that will be called with the load
	//                results.
	load: function load_loki_plugins(selector, locale, callback) {
		var pm = Loki.PluginManager;
		
		if (typeof(selector) != "string") {
			throw new TypeError("Must provide a selector string to load " +
				"plugins.");
		} else if (typeof(callback) != "function") {
			throw new TypeError("Must provide a callback function to receive " +
				"the plugin load results.");
		} else if (typeof(locale) == "string") {
			locale = Loki.Locale.get(locale);
		} else if (typeof(locale) == "object" && !locale.code) {
			throw new TypeError("Invalid locale object.");
		}
		
		var names = pm._chooser.resolveSelector(selector, true);
		var task;
		var names_obj = {
			map: {},
			
			contains: function has_name(name) {
				return (name in this.map);
			},
			
			add: function add_name(name) {
				if (name in this.map)
					return false;
				this.map[name] = true;
				names.push(name);
				task.add(name);
				return true;
			}
		};
		base2.forEach(names, function(name) { names_obj.map[name] = true; });
		task = new pm.Task(callback, names);
		
		base2.forEach(names, function _start_loading_plugin(id) {
			new pm.Loader(id, locale, names_obj);
		});
	},
	
	// Method: watch
	// Adds a listener that will be notified when a certain plugin is
	// registered.
	//
	// Parameters:
	//     (String) plugin_id - the ID of the plugin to watch
	//     (Function) listener - the function that will be called when the
	//                plugin is registered; the function will be called with
	//                the plugin's spec as the sole argument
	//     (Object) [context] - an optional "this" context in which the listener
	//              will be called
	watch: function watch_plugin_registration(plugin_id, listener, context) {
		var watchers = Loki.PluginManager._watchers;
		var callback;
		
		if (context) {
			callback = function call_registration_callback() {
				listener.apply(context, arguments);
			};
		} else {
			callback = listener;
		}
		
		if (!watchers[plugin_id])
			watchers[plugin_id] = [];
		watchers[plugin_id].push(callback);
	},
	
	// Parses a plugin dependency string.
	_parseDependencies: function _parse_plugin_dependencies(plugin, str) {
		var pm = Loki.PluginManager;
		var specs = str.split(/\s*,\s*/);
		var dependencies = {};
		var parts, conditions, name, version, reduce;
		
		// "reverses" an operator; e.g., "<=" is changed to ">="
		function reverse(operator) {
			var p;
			if (0 <= (p = operator.indexOf("<"))) {
				return operator.substr(0, p) + ">" + operator.substr(p + 1);
			} else if (0 <= (p = operator.indexOf(">"))) {
				return operator.substr(0, p) + "<" + operator.substr(p + 1);
			} else {
				return operator;
			}
		}
		
		function parse_version(version, reduce) {
			try {
				var version = Loki.Versions.parse(version);
				
				if (reduce && version.dotted.length < 3 && version.type == 4) {
					// When a version like "3.0" is specified, as opposed to
					// "3.0.0" or "3.0b1", we sometimes want to change it to be
					// the earliest-possible variant of that version. This
					// allows dependencies like "foo >= 3.0" to do what's
					// expected when the "foo" plugin is at, e.g., v3.0b1.
					
					version.dotted.push(0);
					version.type = 0;
					version.modifier = 0;
				}
				
				return version;
			} catch (e) {
				if (e.name == "SyntaxError") {
					throw Loki.error("SyntaxError",
						"plugin:manager:invalid version", plugin, version);
				}
				throw e;
			}
		}
		
		for (var i = 0; i < specs.length; i++) {
			parts = pm._depPattern.exec(specs[i]);
			if (!parts) {
				throw Loki.error("SyntaxError", "plugin:manager:invalid dep",
					plugin, str);
			}
			
			name = parts[4];
			conditions = dependencies[name];
			if (typeof(conditions) == "undefined")
				conditions = dependencies[name] = [];
			
			if (parts[1]) {
				// a condition before the plugin name
				reduce = (parts[3] == "==" || parts[3] == "=" ||
					parts[3] == ">" || parts[3] == "<=");
				conditions.push({
					operator: reverse(parts[3]),
					version: parse_version(parts[2], reduce)
				});
			}
			
			if (parts[5]) {
				// a condition after the plugin name
				reduce = (parts[6] == "==" || parts[6] == "=" ||
					parts[6] == "<" || parts[6] == ">=");
				conditions.push({
					operator: parts[6],
					version: parse_version(parts[7], reduce)
				});
			}
		}
		
		// TODO: Ensure that the dependencies are satisfiable.
		return dependencies;
	},
	
	
	
	_depOps: {
		"==": function(a, b) { return Loki.Versions.compare(a, b) == 0; },
		"=": function(a, b) { return Loki.Versions.compare(a, b) == 0; },
		"<": function(a, b) { return Loki.Versions.compare(a, b) < 0; },
		"<=": function(a, b) { return Loki.Versions.compare(a, b) <= 0; },
		">": function(a, b) { return Loki.Versions.compare(a, b) > 0; },
		">=": function(a, b) { return Loki.Versions.compare(a, b) >= 0; }
	}
};

Loki.PluginManager.Loader = Loki.Class.create({
	initialize: function PluginLoader(plugin_id, locale, all_names) {
		this.id = plugin_id;
		this.locale = locale;
		this.base = $format("{0}plugins/{1}/", Loki.baseURL, plugin_id);
		this.requestedNames = all_names;
		
		this._register();
		
		var plugin = Loki.PluginManager.plugins[plugin_id];
		if (!plugin) {
			this._loadPlugin();
		} else {
			this._pluginLoaded(plugin);
		}
	},
	
	_getTasks: function _loader_get_tasks() {
		var tasks = Loki.PluginManager._loadTasks[this.id];
		return Loki.PluginManager._loadTasks[this.id];
	},
	
	_register: function _register_plugin_loader() {
		var tasks = Loki.PluginManager._loadTasks[this.id];
		if (!tasks)
			return false;
		
		base2.forEach(tasks, function register_with_task(task) {
			task.add(this.id);
		}, this);	
		
		return true;
	},
	
	_fail: function _plugin_load_failed(reason) {
		// Make a copy of our tasks, as tasks will remove themselves from the
		// original array as they are notified of completion.
		var tasks = this._getTasks().slice(0);
		base2.forEach(tasks, function notify_task_of_failure(task) {
			task.stepFailed(this.id, reason);
		}, this);
	},
	
	_loadPlugin: function _load_plugin() {
		var url = this.base + this.id + ".js";
		
		function succeeded(response) {
			Loki.PluginManager.watch(this.id, this._pluginLoaded, this);
			try {
				response.evaluate();
			} catch (e) {
				this._fail(new Loki.Notice("warning",
					Loki._("plugin:manager:evaluation error", this.id, e)));
			}
		}
		
		function failed(response) {
			var status = response.getStatus(), message;
			
			if (status == 404) {
				message = Loki._("plugin:manager:not found", this.id);
			} else {
				message = Loki._("plugin:manager:download failed", this.id,
					status, response.getStatusText());
			}
			
			this._fail(new Loki.Notice("warning", message));
		}
		
		new Loki.Request(url, {
			method: "GET",
			onSuccess: base2.bind(succeeded, this),
			onFailure: base2.bind(failed, this)
		});
	},
	
	_pluginLoaded: function _plugin_loaded(plugin) {
		this._loadDependencies(plugin);
	},
	
	_loadDependencies: function _load_dependencies(plugin) {
		var deps = plugin.dependencies;
		var needed = [];
		var task;
		
		for (var plugin_id in deps) {
			if (!this.requestedNames.contains(plugin_id)) {
				needed.push(plugin_id);
				this.requestedNames.add(plugin_id);
			}
		}
		
		if (needed.length == 0) {
			this._dependenciesLoaded(plugin);
		} else {
			function dependency_subtask_finished(plugins, failed) {
				failed = Loki.Object.keys(failed);
				if (failed.length == 0) {
					this._dependenciesLoaded(plugin);
					return;
				}
				
				this._fail(new Loki.Notice("warning",
					Loki._("plugin:manager:dependencies failed",
					this.id, failed.length, failed.join(", "))));
			}
			
			task = new Loki.PluginManager.Task(
				base2.bind(dependency_subtask_finished, this),
				needed
			);
			
			base2.forEach(needed, function(id) {
				new Loki.PluginManager.Loader(id, this.locale,
					this.requestedNames);
			}, this);
		}
	},
	
	_dependenciesLoaded: function _dependencies_loaded(plugin) {
		var name, constraints, i, c, op;
		var pm = Loki.PluginManager;
		
		// Check dependency version constraints.
		for (name in plugin.dependencies) {
			constraints = plugin.dependencies[name];
			
			for (var i = 0; i < constraints.length; i++) {
				c = constraints[i];
				op = c.operator;
				
				if (!pm._depOps[op](pm.plugins[name].version, c.version)) {
					// Constraint not satisfied.
					c = $format("{0} {1}", op, c.version);
					this._fail(new Loki.Notice("warning", Loki._(
						"plugin:manager:dependency constraint failure",
						this.id, name, c, pm.plugins[name].version)));
					return;
				}
			}
		}
		
		if (typeof(plugin.locales[this.locale]) == "undefined") {
			this._loadLocale(plugin);
		} else {
			this._localeLoaded(plugin);
		}
	},
	
	_loadLocale: function _load_locale(plugin) {
		function load_plugin_locale(locale, next_locale) {
			var url = $format("{0}strings/{1}.js", this.base, locale);
				
			if (locale in plugin.locales) {
				if (next_locale)
					load_plugin_locale.call(this, next_locale)
				else
					this._localeLoaded(plugin);
				return;
			}
			
			function succeeded(response) {
				plugin.locales[locale] = true;
				try {
					response.evaluate();
				} catch (e) {
					// ignore
				}
				
				if (next_locale)
					load_plugin_locale.call(this, next_locale)
				else
					this._localeLoaded(plugin);
			}

			function failed(response) {
				plugin.locales[locale] = false;
				if (next_locale)
					load_plugin_locale.call(this, next_locale)
				else
					this._localeLoaded(plugin);
			}

			new Loki.Request(url, {
				method: "GET",
				onSuccess: base2.bind(succeeded, this),
				onFailure: base2.bind(failed, this)
			});
		}
		
		load_plugin_locale.call(this, this.locale, this.locale.parent);
	},
	
	_localeLoaded: function _locale_loaded(plugin) {
		// All steps complete!
		// Make a copy of our tasks, as tasks will remove themselves from the
		// original array as they are notified of completion.
		var tasks = this._getTasks().slice(0);
		base2.forEach(tasks, function notify_task_of_success(task) {
			task.stepFinished(this.id, plugin.implementation);
		}, this);
	},
});

Loki.PluginManager.Task = Loki.Class.create({
	initialize: function PluginLoadTask(callback, initial_steps) {
		this.callback = callback;
		this.steps = [];
		this.pendingSteps = {};
		this.finishedSteps = {};
		this.failedSteps = {};
		this.remaining = 0;
		
		if (initial_steps)
			this.add(initial_steps);
	},
	
	add: function add_steps_to_task(steps) {
		var tasks = Loki.PluginManager._loadTasks;
		
		if (typeof(steps) == "string")
			steps = [steps];
		
		base2.forEach(steps, function add_step(step) {
			if (step in this.pendingSteps)
				return;
			
			this.remaining++;
			this.pendingSteps[step] = true;
			this.steps.push(step);
			
			if (typeof(tasks[step]) != 'object') {
				tasks[step] = [];
			}
			tasks[step].push(this);
		}, this);
	},
	
	stepFinished: function task_step_finished(name, result) {
		if (!this.pendingSteps[name])
			return false;
		this._removeStep(name);
		this.finishedSteps[name] = result;
		
		if (--this.remaining == 0) {
			this._taskFinished();
		}
		
		return true;
	},
	
	stepFailed: function task_step_failed(name, result) {
		if (!this.pendingSteps[name])
			return false;
		
		this._removeStep(name);
		this.failedSteps[name] = result;
		
		if (--this.remaining == 0) {
			this._taskFinished();
		}
		
		return true;
	},
	
	_removeStep: function _task_remove_step(name) {
		var tasks = Loki.PluginManager._loadTasks;
		delete this.pendingSteps[name];
		
		if (!tasks[name])
			return;
			
		if (tasks[name].length == 0) {
			if (tasks[name][i] === this)
				delete tasks[name];
			return;
		}
		
		for (var i = 0; i < tasks[name].length; i++) {
			if (tasks[name][i] === this) {
				tasks[name].splice(i, 1);
				i--;
			}
		}
	},
	
	_taskFinished: function _task_finished() {
		var callback = this.callback;
		
		var finished = {};
		var failed = {};
		
		// Iterating through this.steps preserves the intitial order of the
		// steps.
		base2.forEach(this.steps, function check_step(name) {
			var result;
			if ((result = this.finishedSteps[name]) != null) {
				finished[name] = result;
			} else if ((result = this.finishedSteps[name]) != null) {
				failed[name] = result;
			}
		}, this);
		
		setTimeout(function call_task_callback() {
			callback(finished, failed);
		}, 5);
	}
});

Loki.PluginManager._depPattern = (function define_plugin_dependency_pattern() {
	var parts = {
	 	version: "(?:\\d+(?:\\.\\d+)*)[\\s-]*(?:(?:a|b|g|rc)[\\s-]*(?:\\d+))?",
		ops: '==|=|<|>|<=|>='
	};
	
	 return new RegExp($format("^(({version})\\s*({ops}))?\\s*(\\w+)\\s*" +
		"(({ops})\\s*({version}))?$", parts));
})();
