pico-8 cartridge // http://www.pico-8.com
version 18
__lua__

-- Manual testing notes:
-- This should show up with 4 tabs (0 - 3)
-- and two functions under tabs 0 and 1,
-- no functions under tab 2,
-- and one function under tab 3.

function tab0_a()
  local not_a_tab = '-->8'
 end

function tab0_b()
end

-->8

function tab1_a()
end

function tab1_b()
end

-->8

-->8

function tab3_a()
end

__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000