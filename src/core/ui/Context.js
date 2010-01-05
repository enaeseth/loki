UI.Context = function EditorDisplayContext(editor) {
	this.editor = editor;
	this._parts = {};
	this._part_order = [];
};

Util.OOP.mixin(UI.Context, {
	_get_part_index: function _context_get_part_index(name) {
		if ('indexOf' in this._part_order) {
			return this._part_order.indexOf(name);
		}
		
		var i;
		for (i = 0; i < this._part_order.length; i++) {
			if (this._part_order[i] == name)
				return i;
		}
		
		return -1;
	},
	
	append_part: function context_append(name, creator) {
		if (name in this._parts) {
			throw new Error('The context already has a part named "' +
				name + '".');
		}
		
		this._parts[name] = creator;
		this._part_order.push(name);
	},
	
	insert_part_before: function context_insert_before(name, target, creator) {
		if (name in this._parts) {
			throw new Error('The context already has a part named "' +
				name + '".');
		} else if (!(target in this._parts)) {
			throw new Error('Cannot insert part "' + name + '": target part ' +
				'"' + target + '" does not exist.');
		}
		
		this._parts[name] = creator;
		var index = this._get_part_index(target);
		this._part_order.splice(index, 0, name);
	},
	
	insert_part_after: function context_insert_after(name, target, creator) {
		if (name in this._parts) {
			throw new Error('The context already has a part named "' +
				name + '".');
		} else if (!(target in this._parts)) {
			throw new Error('Cannot insert part "' + name + '": target part ' +
				'"' + target + '" does not exist.');
		}
		
		this._parts[name] = creator;
		var index = this._get_part_index(target);
		if (index == (this._part_order.length - 1))
			this._part_order.push(name);
		else
			this._part_order.splice(index + 1, 0, name);
	},
	
	enter: function context_enter(root, completion_callback) {
		var i, name;
		for (i = 0; i < this._part_order.length; i++) {
			name = this._part_order[i];
			
			root.appendChild(this._parts[name].call(this, root.ownerDocument));
		}
		
		if (completion_callback)
			completion_callback(this);
	},
	
	exit: function context_exit(root) {
		while (root.lastChild)
			root.removeChild(root.lastChild);
	}
});
