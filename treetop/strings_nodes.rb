require 'treetop'

class StringsNode < Treetop::Runtime::SyntaxNode
  
end

class StringNode < StringsNode
  def value
    body.text_value.gsub('\"', '"')
  end
end

class AssignmentNode < StringsNode
  def strings
    {key.value => value.value}
  end
end

class CommentNode < StringsNode
  def strings
    {}
  end
end

class BlockNode < StringsNode
  def strings
    prefix = scope.value + ":"
    results = {}

    body.strings.each { |key, value|
      results[prefix + key] = value
    }

    results
  end
end

class StatementNode < StringsNode
  def strings
    elements[1].strings
  end
end

class BodyNode < StringsNode
  def strings
    results = {}
    elements.each { |e|
      results.merge! e.strings if e.respond_to? :strings
    }
    results
  end
end




