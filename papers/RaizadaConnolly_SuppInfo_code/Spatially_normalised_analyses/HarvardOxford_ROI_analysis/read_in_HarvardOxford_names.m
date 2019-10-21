% Code to run control analyses described in the
% Supplementary Information accompanying the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.

%% Read in the Harvard-Oxford region names

all_xml_lines = textread('HarvardOxford-Cortical.xml','%s','delimiter','\n');

num_lines = length(all_xml_lines);

region_names = cell(1);

for line_num = 1:num_lines,
   this_line = all_xml_lines{line_num};
   
   %%% The lines with regions have the word "index" in them, e.g.
   %%% <label index="17" x="28" y="39" z="63">Superior Parietal Lobule</label>
   starting_char_of_index_string = strfind(this_line,'index');

   if ~isempty(starting_char_of_index_string),  % If we did actually find "index"
      %%% The number after index starts 7 chars later
      number_string = this_line(starting_char_of_index_string + [7:8]);
      %%% If the number just has one digit, then the second char is "
      if number_string(2)=='"',
         index_num = str2num(number_string(1));
      else,
         index_num = str2num(number_string);
      end;
      %%% The atlas-image intensity value corresponding to this index is
      %%% one greater than the index number
      atlas_intensity_val = index_num+1;
   
      %%% The name of the region is between triangular parentheses
      opening_triangle_parenth_positions = strfind(this_line,'<');         
      closing_triangle_parenth_positions = strfind(this_line,'>'); 
      
      this_region_name = this_line((closing_triangle_parenth_positions(1)+1): ...
                                   (opening_triangle_parenth_positions(2)-1));
      
      region_names{atlas_intensity_val} = this_region_name;
   end;
end;