% Code to run the analyses in the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.

cd /data3/Haxby_data/All_six_subjects/Mat_files

num_subjs = 6;
num_conds = 8;
num_voxels = 69757;
all_subjs_Ts = zeros(num_subjs,num_voxels);
all_subjs_Fs = zeros(num_subjs,num_voxels);
all_subjs_cond_means = zeros(num_subjs,num_conds,num_voxels);

for subj_num = 1:num_subjs,
   
   disp(['Processing subject ' num2str(subj_num) ]);
   
   if subj_num == 5,
      num_TRs_per_cond = 9*11;
      num_TRs_for_rest = 660;
   else
      num_TRs_per_cond = 9*12;
      num_TRs_for_rest = 588;
   end;
   
   mat_file_name = ['subj' num2str(subj_num) 'whole_brain.mat' ];
   load(mat_file_name);
   eval(['this_subj_data = subj' num2str(subj_num) '_data;']);
   eval(['clear ' num2str(subj_num) '_data;']);
   
   %%%% Calculate the t-value of all conds against rest
   cond_activations = zeros(num_conds*num_TRs_per_cond,num_voxels);
   for cond_num = 1:num_conds,
      rows_for_this_cond = (cond_num-1)*num_TRs_per_cond + [1:num_TRs_per_cond];
      cond_activations(rows_for_this_cond,:) = this_subj_data{cond_num};
   end;
   rest_activations = this_subj_data{9};
   clear this_subj_data;
  
   %%% Calculate the most active voxels, against rest
   conds_mean = mean(cond_activations);
   conds_mean_mat = ones(num_conds*num_TRs_per_cond,1) * conds_mean;
   conds_SS = sum( (cond_activations - conds_mean_mat).^2 );
   
   rest_mean = mean(rest_activations);
   rest_mean_mat = ones(num_TRs_for_rest,1) * rest_mean;
   rest_SS = sum( (rest_activations - rest_mean_mat).^2 );
   
   n = (num_conds*num_TRs_per_cond + num_TRs_for_rest - 2);
   pooled_std = sqrt( (conds_SS + rest_SS)/ n );
   
   root_sum_of_reciprocals = sqrt( 1/(num_conds*num_TRs_per_cond) + 1/num_TRs_for_rest );
   t_manual = (conds_mean - rest_mean)./ (pooled_std * root_sum_of_reciprocals );
   all_subjs_Ts(subj_num,:) = t_manual;

   % Uncomment this next line to verify that t_manual is same as Matlab's t-vals
   %[h,p,ci,t] = ttest2(cond_activations,rest_activations);
   
   %%% Now compute within-vs-between variances between the non-rest conds, i.e. ANOVA
   groups_vec = zeros(1,num_conds*num_TRs_per_cond);
   means_for_each_cond = zeros(num_conds,num_voxels);
   within_cond_vars = zeros(num_conds,num_voxels);
   for cond_num = 1:num_conds,
      disp(['Calculating within-vs-between variances for cond ' num2str(cond_num) ' subj ' num2str(subj_num) ]);
      inds_for_this_cond = (cond_num-1)*num_TRs_per_cond + [1:num_TRs_per_cond];
      groups_vec(inds_for_this_cond) = cond_num;
      means_for_each_cond(cond_num,:) = mean(cond_activations(inds_for_this_cond,:));
      within_cond_vars(cond_num,:) = var(cond_activations(inds_for_this_cond,:));
      
      all_subjs_cond_means(subj_num,cond_num,:) = means_for_each_cond(cond_num,:);
   end;
   
   between_cond_var = num_TRs_per_cond * var(means_for_each_cond);
   F_manual = between_cond_var ./ mean(within_cond_vars);
   all_subjs_Fs(subj_num,:) = F_manual;

   % Uncomment these next lines to verify that F_manual is same as Matlab's F-vals
%    F_matlab = zeros(1,num_voxels);
%    for voxel_num = 1:num_voxels,
%       if rem(voxel_num,1000)==0,
%          disp(['Voxel ' num2str(voxel_num) ]);
%       end;
%       [anova_p,anova_table,anova_stats,anova_terms] = anovan(cond_activations(:,voxel_num),{groups_vec},'display','off');
%       this_F = anova_table{2,6};
%       F_matlab(voxel_num) = this_F;
%    end;
   
end;  %%% End of loop through subjects

save normed_haxby_Ts_and_Fs.mat all*
clear all;close all
load normed_haxby_Ts_and_Fs.mat

num_subjs = 6;
num_conds = 8;
num_voxels = 69757;
%%%% Next, rank the voxels based on their T and F values, and select the
%%%% best voxels.
proportion_cutoff = 0.05;  %%% We are going to select the top 5%

length_of_a_squareform_vec = num_conds*(num_conds-1)/2;
all_subjs_squareform_sims = zeros(num_subjs,length_of_a_squareform_vec);

V = spm_vol('/data3/Haxby_data/All_six_subjects/Masks_test/wholebrain_mask_haxby_space.nii');
m = spm_read_vols(V);
selected_voxels_vol = zeros(size(m));
sum_of_Fs_vol = zeros(size(m));
sum_of_Ts_vol = zeros(size(m));

writing_vols = 1;  %%% Set this to 1 if you want to write the volumes

for subj_num = 1:num_subjs,
   
   disp(['Processing subject ' num2str(subj_num) ]);
   
   this_subj_Ts = all_subjs_Ts(subj_num,:);
   %%% NaNs get sorted to be the maximum value, so we need to zero them
   this_subj_Ts(isnan(this_subj_Ts)) = 0;
   [sorted_T_vals, sorted_T_indices] = sort(this_subj_Ts,'descend');
   [ascending_count,T_rank_of_each_voxel] = sort(sorted_T_indices);

   this_subj_Fs = all_subjs_Fs(subj_num,:);
   %%% NaNs get sorted to be the maximum value, so we need to zero them
   this_subj_Fs(isnan(this_subj_Fs)) = 0;
   [sorted_F_vals, sorted_F_indices] = sort(this_subj_Fs,'descend');
   [ascending_count,F_rank_of_each_voxel] = sort(sorted_F_indices); 
   
   cutoff_rank = round( proportion_cutoff * num_voxels );
   intersection_of_best_Ts_and_Fs = find( (T_rank_of_each_voxel < cutoff_rank) & ...
                                          (F_rank_of_each_voxel < cutoff_rank) );
   
   selected_voxels = intersection_of_best_Ts_and_Fs;
   
   disp(['Num selected voxels ' num2str(length(selected_voxels)) ]);
   
   cond_activations_of_selected_voxels = squeeze(all_subjs_cond_means(subj_num,:,selected_voxels));
   selected_voxels_corr_mat = corr(cond_activations_of_selected_voxels');
   
   if writing_vols,
      %%% Add the selected voxels to the volume of all of them
      eval(['load subj' num2str(subj_num) 'voxel_coords.mat']);
      eval(['this_subj_coords = subj' num2str(subj_num) '_voxel_coords;']);
      for voxel_num = 1:num_voxels,
         xyz = double(this_subj_coords(voxel_num,:)) + [1 1 1];
         sum_of_Fs_vol(xyz(1),xyz(2),xyz(3)) = sum_of_Fs_vol(xyz(1),xyz(2),xyz(3)) + this_subj_Fs(voxel_num);
         sum_of_Ts_vol(xyz(1),xyz(2),xyz(3)) = sum_of_Ts_vol(xyz(1),xyz(2),xyz(3)) + this_subj_Ts(voxel_num); 
         if ismember(voxel_num,selected_voxels),
            selected_voxels_vol(xyz(1),xyz(2),xyz(3)) = selected_voxels_vol(xyz(1),xyz(2),xyz(3)) + 1;
         end;
      end;
   end;
   all_subjs_squareform_sims(subj_num,:) = squareform(selected_voxels_corr_mat - eye(num_conds));
end;

if writing_vols,
   V.fname = 'selected_voxels_vol.nii';
   spm_write_vol(V,selected_voxels_vol/num_subjs);
   V.fname = 'average_Fs_vol.nii';
   spm_write_vol(V,sum_of_Fs_vol/num_subjs);
   V.fname = 'average_Ts_vol.nii';
   spm_write_vol(V,sum_of_Ts_vol/num_subjs);
end;

save haxby_wholebrain_selected_voxels_sims.mat all_subjs_squareform_sims

