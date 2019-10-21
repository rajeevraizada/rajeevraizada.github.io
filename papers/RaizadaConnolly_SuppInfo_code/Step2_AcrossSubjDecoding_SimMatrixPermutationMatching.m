% Code to run the analyses in the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.
%
% It reads in the file "haxby2001_sim_matrices_VT.mat",
% containing the similarity matrices for each of the six subjects.
% That .mat file needs to have been previously made by the Python script:
% Step1_ReadHaxbyData_WriteMatlabSimMatrixSquareforms.py
%
% The similarity matrices are stored in "squareform" format, for convenience.
% In squareform format, the 8*(8-1)/2=28 unique values 
% in the 8*8 symmetrical similarity matrix
% are stretched out into a single 28-element vector.
% See http://www.mathworks.com/help/toolbox/stats/squareform.html
%
% This code requires the Matlab Statistics toolbox.
%
% It shouldn't take long for this across-subject decoding program to run.
% On an Intel Core2 Quad CPU 2.4GHz running Ubuntu Linux 8.10,
% the whole program runs in less than 2 seconds.

load haxby2001_sim_matrices_VT.mat
the_sims_made_from_true_labels = all_subjs_squareform_sims';
labels = {'bottle ' 'cat ' 'chair ' 'face ' 'house ' 'scissors ' 'scrambledpix ' 'shoe '};

num_subjs = size(the_sims_made_from_true_labels,2);
num_conds = length(labels);

all_possible_perms = perms(1:num_conds);  %%% For 8 conds, there are 40320 = 8!
num_perms = factorial(num_conds);

length_of_a_squareform_vec = num_conds*(num_conds-1)/2;
squareform_extractor_mat = tril(true(num_conds),-1);

best_matching_perms_rec = zeros(num_conds,num_subjs);
subjects_prop_correct_rec = zeros(1,num_subjs);   
classes_correct_rec = zeros(num_subjs,num_conds);

for subj_num = 1:num_subjs,
   
   %%% Read in the column of true sims for this subj
   this_subj_true_sims = the_sims_made_from_true_labels(:,subj_num);
   this_subj_true_sim_matrix = squareform(this_subj_true_sims);
  
   %%% To speed things up, we can z-score the sim matrices.
   %%% This does not affect the correlations between them,
   %%% or between their permed versions.
   %%% But it enormously speeds up the calculation of those corrs
   this_subj_sim_mat_mean = mean(this_subj_true_sims);
   this_subj_sim_mat_std = std(this_subj_true_sims);
   this_subj_true_sim_vec_zscored = (this_subj_true_sims-this_subj_sim_mat_mean) / this_subj_sim_mat_std;
   this_subj_true_sim_mat_zscored = squareform(this_subj_true_sim_vec_zscored);
     
   %%% Now let's see which of these perms matches best with the average
   %%% sim-matrix from the other subjects
   the_other_subjects = setdiff([1:num_subjs],subj_num);  
   sim_vecs_from_the_other_subjects = the_sims_made_from_true_labels(:,the_other_subjects);
   other_subjs_avg_sim_vec = mean(sim_vecs_from_the_other_subjects,2);
   %%% We will z-score this subj-average sim-vec, like we did above
   other_subjs_avg_sims_mean = mean(other_subjs_avg_sim_vec);
   other_subjs_avg_sims_std = std(other_subjs_avg_sim_vec);
   other_subjs_avg_sim_vec_zscored = ...
      (other_subjs_avg_sim_vec - other_subjs_avg_sims_mean) / other_subjs_avg_sims_std;
   other_subjs_avg_sim_mat_zscored = squareform(other_subjs_avg_sim_vec_zscored);

   corrs_of_this_subjs_perms_with_other_subjs = zeros(1,num_perms);

   for perm_num = 1:num_perms,
      this_perm = all_possible_perms(perm_num,:);

      %%% Make the permed-label sim matrix
      sim_matrix_for_this_perm = this_subj_true_sim_mat_zscored(this_perm,this_perm);

      %%% Ok, now we have a sim_matrix for this perm
      vec_version_of_this_perms_sim_matrix = sim_matrix_for_this_perm(squareform_extractor_mat);
      this_corr = vec_version_of_this_perms_sim_matrix' * other_subjs_avg_sim_vec_zscored / ...
                            (length_of_a_squareform_vec-1);
                         
      corrs_of_this_subjs_perms_with_other_subjs(perm_num) = this_corr;

   end;  %%% End of loop through perms
   
   [across_subj_max_val,across_subj_max_ind] = ...
      max(corrs_of_this_subjs_perms_with_other_subjs);

   the_best_matching_perm = all_possible_perms(across_subj_max_ind,:);
   %%% Store this
   best_matching_perms_rec(:,subj_num) = the_best_matching_perm;
   %%% See how many perm entries were correct, and store it
   prop_correct = sum(the_best_matching_perm==[1:num_conds]) / num_conds;
   subjects_prop_correct_rec(subj_num) = prop_correct;
   classes_correct_rec(subj_num,:) = (the_best_matching_perm==[1:num_conds]);

   disp(['Subj ' num2str(subj_num) ': Best-matching perm with other subjects was ' ...
          num2str(the_best_matching_perm) ...
         ' and was r=' num2str(across_subj_max_val) ...
         '. Prop correct = ' num2str(prop_correct) ]);

   %%% If we didn't get 100% correct, let's see what the labels
   %%% of the swapped items were
   if prop_correct~=1,
      wrongly_labeled_items = find(the_best_matching_perm ~= [1:num_conds]);
      disp(['The wrongly labeled items were ' labels{wrongly_labeled_items} ]);
   end;
      
end;  %%% End of loop through subjs
      
mean_subj_prop_correct = mean(subjects_prop_correct_rec);
disp(['Average prop correct across all subjects = ' num2str(mean_subj_prop_correct) ]);


