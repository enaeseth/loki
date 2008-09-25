module Strings
  include Treetop::Runtime

  def root
    @root || :body
  end

  def _nt_body
    start_index = index
    if node_cache[:body].has_key?(index)
      cached = node_cache[:body][index]
      @index = cached.interval.end if cached
      return cached
    end

    s0, i0 = [], index
    loop do
      r1 = _nt_statement
      if r1
        s0 << r1
      else
        break
      end
    end
    if s0.empty?
      self.index = i0
      r0 = nil
    else
      r0 = BodyNode.new(input, i0...index, s0)
    end

    node_cache[:body][start_index] = r0

    return r0
  end

  module Statement0
    def white
      elements[0]
    end

  end

  def _nt_statement
    start_index = index
    if node_cache[:statement].has_key?(index)
      cached = node_cache[:statement][index]
      @index = cached.interval.end if cached
      return cached
    end

    i0, s0 = index, []
    r1 = _nt_white
    s0 << r1
    if r1
      i2 = index
      r3 = _nt_block
      if r3
        r2 = r3
      else
        r4 = _nt_assignment
        if r4
          r2 = r4
        else
          r5 = _nt_comment
          if r5
            r2 = r5
          else
            self.index = i2
            r2 = nil
          end
        end
      end
      s0 << r2
    end
    if s0.last
      r0 = (StatementNode).new(input, i0...index, s0)
      r0.extend(Statement0)
    else
      self.index = i0
      r0 = nil
    end

    node_cache[:statement][start_index] = r0

    return r0
  end

  module Block0
    def scope
      elements[0]
    end

    def white
      elements[1]
    end

    def body
      elements[3]
    end

    def white
      elements[4]
    end

    def white
      elements[6]
    end

    def white
      elements[8]
    end
  end

  def _nt_block
    start_index = index
    if node_cache[:block].has_key?(index)
      cached = node_cache[:block][index]
      @index = cached.interval.end if cached
      return cached
    end

    i0, s0 = index, []
    r1 = _nt_string
    s0 << r1
    if r1
      r2 = _nt_white
      s0 << r2
      if r2
        if input.index('{', index) == index
          r3 = (SyntaxNode).new(input, index...(index + 1))
          @index += 1
        else
          terminal_parse_failure('{')
          r3 = nil
        end
        s0 << r3
        if r3
          r4 = _nt_body
          s0 << r4
          if r4
            r5 = _nt_white
            s0 << r5
            if r5
              if input.index('}', index) == index
                r6 = (SyntaxNode).new(input, index...(index + 1))
                @index += 1
              else
                terminal_parse_failure('}')
                r6 = nil
              end
              s0 << r6
              if r6
                r7 = _nt_white
                s0 << r7
                if r7
                  if input.index(';', index) == index
                    r8 = (SyntaxNode).new(input, index...(index + 1))
                    @index += 1
                  else
                    terminal_parse_failure(';')
                    r8 = nil
                  end
                  s0 << r8
                  if r8
                    r9 = _nt_white
                    s0 << r9
                  end
                end
              end
            end
          end
        end
      end
    end
    if s0.last
      r0 = (BlockNode).new(input, i0...index, s0)
      r0.extend(Block0)
    else
      self.index = i0
      r0 = nil
    end

    node_cache[:block][start_index] = r0

    return r0
  end

  module Assignment0
    def key
      elements[0]
    end

    def white
      elements[1]
    end

    def white
      elements[3]
    end

    def value
      elements[4]
    end

    def white
      elements[5]
    end

  end

  def _nt_assignment
    start_index = index
    if node_cache[:assignment].has_key?(index)
      cached = node_cache[:assignment][index]
      @index = cached.interval.end if cached
      return cached
    end

    i0, s0 = index, []
    r1 = _nt_string
    s0 << r1
    if r1
      r2 = _nt_white
      s0 << r2
      if r2
        if input.index('=', index) == index
          r3 = (SyntaxNode).new(input, index...(index + 1))
          @index += 1
        else
          terminal_parse_failure('=')
          r3 = nil
        end
        s0 << r3
        if r3
          r4 = _nt_white
          s0 << r4
          if r4
            r5 = _nt_string
            s0 << r5
            if r5
              r6 = _nt_white
              s0 << r6
              if r6
                if input.index(';', index) == index
                  r7 = (SyntaxNode).new(input, index...(index + 1))
                  @index += 1
                else
                  terminal_parse_failure(';')
                  r7 = nil
                end
                s0 << r7
              end
            end
          end
        end
      end
    end
    if s0.last
      r0 = (AssignmentNode).new(input, i0...index, s0)
      r0.extend(Assignment0)
    else
      self.index = i0
      r0 = nil
    end

    node_cache[:assignment][start_index] = r0

    return r0
  end

  module Comment0
  end

  module Comment1
    def white
      elements[3]
    end
  end

  def _nt_comment
    start_index = index
    if node_cache[:comment].has_key?(index)
      cached = node_cache[:comment][index]
      @index = cached.interval.end if cached
      return cached
    end

    i0, s0 = index, []
    if input.index('/*', index) == index
      r1 = (SyntaxNode).new(input, index...(index + 2))
      @index += 2
    else
      terminal_parse_failure('/*')
      r1 = nil
    end
    s0 << r1
    if r1
      s2, i2 = [], index
      loop do
        i3, s3 = index, []
        i4 = index
        if input.index('*/', index) == index
          r5 = (SyntaxNode).new(input, index...(index + 2))
          @index += 2
        else
          terminal_parse_failure('*/')
          r5 = nil
        end
        if r5
          r4 = nil
        else
          self.index = i4
          r4 = SyntaxNode.new(input, index...index)
        end
        s3 << r4
        if r4
          if index < input_length
            r6 = (SyntaxNode).new(input, index...(index + 1))
            @index += 1
          else
            terminal_parse_failure("any character")
            r6 = nil
          end
          s3 << r6
        end
        if s3.last
          r3 = (SyntaxNode).new(input, i3...index, s3)
          r3.extend(Comment0)
        else
          self.index = i3
          r3 = nil
        end
        if r3
          s2 << r3
        else
          break
        end
      end
      r2 = SyntaxNode.new(input, i2...index, s2)
      s0 << r2
      if r2
        if input.index('*/', index) == index
          r7 = (SyntaxNode).new(input, index...(index + 2))
          @index += 2
        else
          terminal_parse_failure('*/')
          r7 = nil
        end
        s0 << r7
        if r7
          r8 = _nt_white
          s0 << r8
        end
      end
    end
    if s0.last
      r0 = (CommentNode).new(input, i0...index, s0)
      r0.extend(Comment1)
    else
      self.index = i0
      r0 = nil
    end

    node_cache[:comment][start_index] = r0

    return r0
  end

  module String0
  end

  module String1
    def body
      elements[1]
    end

  end

  module String2
  end

  module String3
    def body
      elements[1]
    end

  end

  def _nt_string
    start_index = index
    if node_cache[:string].has_key?(index)
      cached = node_cache[:string][index]
      @index = cached.interval.end if cached
      return cached
    end

    i0 = index
    i1, s1 = index, []
    if input.index('"', index) == index
      r2 = (SyntaxNode).new(input, index...(index + 1))
      @index += 1
    else
      terminal_parse_failure('"')
      r2 = nil
    end
    s1 << r2
    if r2
      s3, i3 = [], index
      loop do
        i4 = index
        i5, s5 = index, []
        i6 = index
        if input.index('"', index) == index
          r7 = (SyntaxNode).new(input, index...(index + 1))
          @index += 1
        else
          terminal_parse_failure('"')
          r7 = nil
        end
        if r7
          r6 = nil
        else
          self.index = i6
          r6 = SyntaxNode.new(input, index...index)
        end
        s5 << r6
        if r6
          if index < input_length
            r8 = (SyntaxNode).new(input, index...(index + 1))
            @index += 1
          else
            terminal_parse_failure("any character")
            r8 = nil
          end
          s5 << r8
        end
        if s5.last
          r5 = (SyntaxNode).new(input, i5...index, s5)
          r5.extend(String0)
        else
          self.index = i5
          r5 = nil
        end
        if r5
          r4 = r5
        else
          if input.index('\"', index) == index
            r9 = (SyntaxNode).new(input, index...(index + 2))
            @index += 2
          else
            terminal_parse_failure('\"')
            r9 = nil
          end
          if r9
            r4 = r9
          else
            self.index = i4
            r4 = nil
          end
        end
        if r4
          s3 << r4
        else
          break
        end
      end
      r3 = SyntaxNode.new(input, i3...index, s3)
      s1 << r3
      if r3
        if input.index('"', index) == index
          r10 = (SyntaxNode).new(input, index...(index + 1))
          @index += 1
        else
          terminal_parse_failure('"')
          r10 = nil
        end
        s1 << r10
      end
    end
    if s1.last
      r1 = (StringNode).new(input, i1...index, s1)
      r1.extend(String1)
    else
      self.index = i1
      r1 = nil
    end
    if r1
      r0 = r1
    else
      i11, s11 = index, []
      if input.index('\'', index) == index
        r12 = (SyntaxNode).new(input, index...(index + 1))
        @index += 1
      else
        terminal_parse_failure('\'')
        r12 = nil
      end
      s11 << r12
      if r12
        s13, i13 = [], index
        loop do
          i14 = index
          i15, s15 = index, []
          i16 = index
          if input.index('\'', index) == index
            r17 = (SyntaxNode).new(input, index...(index + 1))
            @index += 1
          else
            terminal_parse_failure('\'')
            r17 = nil
          end
          if r17
            r16 = nil
          else
            self.index = i16
            r16 = SyntaxNode.new(input, index...index)
          end
          s15 << r16
          if r16
            if index < input_length
              r18 = (SyntaxNode).new(input, index...(index + 1))
              @index += 1
            else
              terminal_parse_failure("any character")
              r18 = nil
            end
            s15 << r18
          end
          if s15.last
            r15 = (SyntaxNode).new(input, i15...index, s15)
            r15.extend(String2)
          else
            self.index = i15
            r15 = nil
          end
          if r15
            r14 = r15
          else
            if input.index('\\\'', index) == index
              r19 = (SyntaxNode).new(input, index...(index + 2))
              @index += 2
            else
              terminal_parse_failure('\\\'')
              r19 = nil
            end
            if r19
              r14 = r19
            else
              self.index = i14
              r14 = nil
            end
          end
          if r14
            s13 << r14
          else
            break
          end
        end
        r13 = SyntaxNode.new(input, i13...index, s13)
        s11 << r13
        if r13
          if input.index('\'', index) == index
            r20 = (SyntaxNode).new(input, index...(index + 1))
            @index += 1
          else
            terminal_parse_failure('\'')
            r20 = nil
          end
          s11 << r20
        end
      end
      if s11.last
        r11 = (StringNode).new(input, i11...index, s11)
        r11.extend(String3)
      else
        self.index = i11
        r11 = nil
      end
      if r11
        r0 = r11
      else
        self.index = i0
        r0 = nil
      end
    end

    node_cache[:string][start_index] = r0

    return r0
  end

  def _nt_white
    start_index = index
    if node_cache[:white].has_key?(index)
      cached = node_cache[:white][index]
      @index = cached.interval.end if cached
      return cached
    end

    s0, i0 = [], index
    loop do
      if input.index(Regexp.new('[ \\t\\n]'), index) == index
        r1 = (SyntaxNode).new(input, index...(index + 1))
        @index += 1
      else
        r1 = nil
      end
      if r1
        s0 << r1
      else
        break
      end
    end
    r0 = SyntaxNode.new(input, i0...index, s0)

    node_cache[:white][start_index] = r0

    return r0
  end

end

class StringsParser < Treetop::Runtime::CompiledParser
  include Strings
end
