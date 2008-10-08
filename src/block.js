// Namespace: Loki.Block
// Defines the behavior of block-level elements with regard to paragraphs.
Loki.Block = {
	// const: (Number) BLOCK
	// Element is a block-level element. (0x01)
	BLOCK: 1,
	
	// const: (Number) PARAGRAPH
	// Element is a paragraph. It cannot contain two line breaks in succession.
	// (0x02)
	PARAGRAPH: 2,
	
	// const: (Number) PARAGRAPH_CONTAINER
	// Element can contain paragraphs (and, in fact, all inline content should
	// be within them). (0x04)
	PARAGRAPH_CONTAINER: 4,
	
	// const: (Number) MULTI_PARAGRAPH_CONTAINER
	// Inline content nodes should be direct children of this element unless
	// multiple paragraphs are desired, in which case it should behave as a
	// paragraph container. (0x08)
	MULTI_PARAGRAPH_CONTAINER: 8,
	
	// const: (Number) INLINE_CONTAINER
	// Directly contains inline content; should not contain paragraphs. (0x10)
	INLINE_CONTAINER: 16,
	
	// const: (Number) EMPTY
	// Block-level element that may not contain anything. (0x20)
	EMPTY: 32,
	
	// const: (Number) MIXED
	// Can exist as either a block-level element or an inline child of a block-
	// level element. (0x40)
	MIXED: 64,
	
	// const: (Number) PREFORMATTED
	// Contains preformatted content. (0x80)
	PREFORMATTED: 128,
	
	getFlags: function get_element_flags(element) {
		var tn = element.tagName || element.toUpperCase();
		return (Loki.Block.Flags[tn] || 0);
	},
	
	isBlock: function is_block(element) {
		return !!(Loki.Block.getFlags(element) & Loki.Block.BLOCK);
	},
	
	isParagraphContainer: function is_paragraph_container(element) {
		return !!(Loki.Block.getFlags(element) &
			Loki.Block.PARAGRAPH_CONTAINER);
	},
	
	isMultiParagraphContainer: function is_multi_paragraph_container(element) {
		return !!(Loki.Block.getFlags(element) &
			Loki.Block.MULTI_PARAGRAPH_CONTAINER);
	},
	
	isInlineContainer: function is_inline_container(element) {
		return !!(Loki.Block.getFlags(element) & Loki.Block.INLINE_CONTAINER);
	},
	
	isEmpty: function is_empty(element) {
		return !!(Loki.Block.getFlags(element) & Loki.Block.EMPTY);
	},
	
	isMixed: function is_mixed(element) {
		return !!(Loki.Block.getFlags(element) & Loki.Block.MIXED);
	},
	
	/** @private */
	Flags: {}
};

Loki.Object.extend(Loki.Block.Flags, {
	P: Loki.Block.BLOCK | Loki.Block.PARAGRAPH,
	
	BODY: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	OBJECT: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	BLOCKQUOTE: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	FORM: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	FIELDSET: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	BUTTON: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	MAP: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	NOSCRIPT: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER,
	DIV: Loki.Block.BLOCK | Loki.Block.PARAGRAPH_CONTAINER, // was multi

	H1: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	H2: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	H3: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	H4: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	H5: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	H6: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	ADDRESS: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER,
	PRE: Loki.Block.BLOCK | Loki.Block.INLINE_CONTAINER |
		Loki.Block.PREFORMATTED,

	TH: Loki.Block.BLOCK | Loki.Block.MULTI_PARAGRAPH_CONTAINER,
	TD: Loki.Block.BLOCK | Loki.Block.MULTI_PARAGRAPH_CONTAINER,
	LI: Loki.Block.BLOCK | Loki.Block.MULTI_PARAGRAPH_CONTAINER,
	DT: Loki.Block.BLOCK | Loki.Block.MULTI_PARAGRAPH_CONTAINER,
	DD: Loki.Block.BLOCK | Loki.Block.MULTI_PARAGRAPH_CONTAINER, // was pc
	
	UL: Loki.Block.BLOCK,
	OL: Loki.Block.BLOCK,
	DL: Loki.Block.BLOCK,
	
	TABLE: Loki.Block.BLOCK,
	THEAD: Loki.Block.BLOCK,
	TBODY: Loki.Block.BLOCK,
	TFOOT: Loki.Block.BLOCK,
	TR: Loki.Block.BLOCK,
	NOFRAMES: Loki.Block.BLOCK,
	
	HR: Loki.Block.BLOCK | Loki.Block.EMPTY,
	IFRAME: Loki.Block.BLOCK | Loki.Block.EMPTY,
	
	// XXX: browsers seem to treat these as inline always
	INS: Loki.Block.BLOCK | Loki.Block.MIXED,
	DEL: Loki.Block.BLOCK | Loki.Block.MIXED
});
