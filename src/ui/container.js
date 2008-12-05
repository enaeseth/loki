// Class: Loki.UI.Container
// Generic superclass for most container widgets. To learn how to write your
// own container classes, it's best to read the source for this file and to look
// at some examples.
Loki.UI.Container = Loki.Class.create(Loki.UI.Widget, {
	// Constructor: Container
	// Creates a new container.
	initialize: function Container() {
		if ("function" != typeof(this._createRoot)) {
			throw new Error("Loki.UI.Container is an abstract class; " +
				"subclasses must implement #_createRoot().");
		}
		this._element = null;
		this._members = [];
	},
	
	add: function add_to_container(widget, selector) {
		this._addMember({
			widget: widget,
			selector: selector || ""
		});
	},
	
	_addMember: function _container_add_member(member) {
		this._members.push(member);
	},
	
	_getMembers: function _container_get_members() {
		return this._members;
	},
	
	create: function create_container_body(document) {
		if (this.element)
			return this.element;
		
		this.element = this._createRoot();
		
		function get_selector(member) {
			var sel = [];
			if (this._getMemberSelector)
				sel.push(this._getMemberSelector(member, document));
			if (member.selector && member.selector.length > 0)
				sel.push(member.selector);
			return sel.join(', ');
		}
		
		var members = this._getMembers();
		base2.forEach(members, function process_container_member(member) {
			var sel = get_selector.call(this, member);
			var container = Loki.Misc.CSS.elementFromSelector(sel);
			container.appendChild(member.widget.create(document));
			this.element.appendChild(container);
		}, this);
		
		return this.element;
	}
});
