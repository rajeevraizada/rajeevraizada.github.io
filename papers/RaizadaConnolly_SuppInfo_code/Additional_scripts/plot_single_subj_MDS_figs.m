% Code to run control analyses described in the
% Supplementary Information accompanying the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.

% This code produces the multidimensional scaling (MDS) plots
% in Figure 1 of the paper.
% It calculates the MDS coordinates, and then plots the text labels
% in those coordinate positions.
% The thumbnail graphics with transparent surrounds in Fig.1 
% were manually placed into the figures, centered on the text labels.
% The Matlab function for calculating MDS, mdscale,
% requires the Statistics Toolbox.
% Note that the two-dimensional MDS projection
% is a reduced representation of the full eight-dimensional 
% similarity-space, and does not capture all of its structure.
% For some of the subjects, the residual MDS "stress"
% exceeds the default Matlab criterion, and a warning is printed.

% First, we read in the similarity matrices
% which were calculated from the fMRI data by the script
% Step1_ReadHaxbyData_WriteMatlabSimMatrixSquareforms.py
load haxby2001_sim_matrices_VT.mat
labels = {'bottle' 'cat' 'chair' 'face' 'house' 'scissors' 'scrambledpix' 'shoe'};

num_subjs = 6;
num_conds = length(labels);

for subj_num = 1:num_subjs,

   disp(['Subj ' num2str(subj_num)]);
   
   this_subj_squareform_vec = all_subjs_squareform_sims(subj_num,:);
   this_subj_dist_matrix = squareform(1-this_subj_squareform_vec);
   
   [mds_coords,stress] = mdscale(this_subj_dist_matrix,2);
   
   x = mds_coords(:,1);
   y = mds_coords(:,2);
   
   figure(subj_num);
   clf;
   for cond_num = 1:num_conds,
      text(x(cond_num),y(cond_num),labels{cond_num},'Color','r');
   end;
   
   axis(1.3*[min(x) max(x) min(y) max(y)]);
   axis('off');
   % Uncomment this next line if you want to print a PDF of the figure
   % eval(['print -dpdf subj' num2str(subj_num) '_mds.pdf'])
end;
   

