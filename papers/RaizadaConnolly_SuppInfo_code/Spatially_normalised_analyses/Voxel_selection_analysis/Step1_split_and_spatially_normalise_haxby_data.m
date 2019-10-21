% Code to run control analyses described in the
% Supplementary Information accompanying the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.
%
% The script below uses functions from SPM8, downloadable from
% http://www.fil.ion.ucl.ac.uk/spm/software/spm8/

base_dir = '/data3/Haxby_data/All_six_subjects/';
spm_defaults;

num_subjs = 6;
num_runs = 12;

for subj_num = 1:num_subjs,

   disp(['Running batch preprocessing on subject ' num2str(subj_num) ]);

   subj_name = ['subj' num2str(subj_num) ];
   this_subj_base_dir = [base_dir subj_name '/'];
   cd(this_subj_base_dir);

   %% Make the SPM dir, and copy and split the BOLD files
   mkdir('SPM');
   mkdir('SPM/Bold');
   unix(['cp bold.nii.gz SPM/Bold/']);
   mkdir('SPM/VT_mask');
   unix(['cp mask4_vt.nii.gz SPM/VT_mask/']);
   unix(['gunzip SPM/VT_mask/mask4_vt.nii.gz']);
   cd('SPM/Bold');
   unix(['gunzip bold.nii.gz']); 
   
   disp('Applying BET brain extraction to BOLD 4D file');
   unix('bet bold.nii bet_bold.nii -F');
    
   this_subj_bold_dir = [ this_subj_base_dir 'SPM/Bold/' ];
   cd(this_subj_bold_dir);
   disp('Splitting the BOLD files');
   unix(['fslsplit bet_bold.nii ' subj_name '_bold -t']);
   unix('rm bold.nii bet_bold.nii');
   
   %% Make a mean-bold image
   
   [bold_files,dirs]=spm_select('ExtFPList',this_subj_bold_dir,['^subj.*\.nii$' ]);
   disp('Reading in BOLD files, in order to make mean image');
   V = spm_vol(bold_files);
   m = spm_read_vols(V);
   m_mean = mean(m,4);   % Average across volumes, which is dim-4
   V_mean = spm_vol([subj_name '_bold0000.nii']);
   V_mean.fname = ['mean_' subj_name '_bold.nii'];
   spm_write_vol(V_mean,m_mean);
   
   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% the BOLD-normalise job
   % First, load a manually premade SPM batch job.
   load haxby_normalise_batch.mat
   %% Use the meanbold image made at the realign step as the source image
   mean_image = spm_select('ExtFPList',this_subj_bold_dir,['^mean.*\.nii$' ]);
   matlabbatch{1}.spm.spatial.normalise.estwrite.subj.source = cellstr(mean_image);
   [bold_files,dirs]=spm_select('ExtFPList',this_subj_bold_dir, ...
      ['^subj' num2str(subj_num) '.*\.nii$' ]);
   %% Put this subject's BOLD files into the jobs struct   
   %% Put the mean image in the list of images to be normalised, too
   %% It seems that in this case we need to convert it into a cell-array
   [mean_image,dir] = spm_select('ExtFPList',this_subj_bold_dir,['^mean.*\.nii$' ]);
   bold_files_cell_array = cellstr(bold_files);
   bold_files_cell_array{length(bold_files_cell_array)+1} = mean_image; 
   %% And also add the VT mask
   this_subj_VT_mask_dir = [ this_subj_base_dir 'SPM/VT_mask/' ];
   [vt_mask,dir] = spm_select('ExtFPList',this_subj_VT_mask_dir,['^mask4.*\.nii$' ]);
   bold_files_cell_array{length(bold_files_cell_array)+1} = vt_mask; 
   
   matlabbatch{1}.spm.spatial.normalise.estwrite.subj.resample ...
          = bold_files_cell_array;     
   %% Specify that we're going to write with almost the same original voxel size
   matlabbatch{1}.spm.spatial.normalise.estwrite.roptions.vox = [ 3 3 3 ];
   %% Run the normalise job
   spm_jobman('run',matlabbatch);

   %%% Recombine the normalised bold data into 4D .nii files
   cd(this_subj_bold_dir);
   disp('Recombining the normalised split 3D BOLD files into a single 4D file');
   unix(['fslmerge -t w' subj_name '_bold.nii wsubj*.nii']);
   unix('mkdir ../4D_normalised');
   unix(['mv w' subj_name '_bold.nii  ../4D_normalised']);

end;  % End of loop through subjects

%%%% Finally, make a subject-average VT mask

disp('Making subject-average VT mask')

all_VT_masks = [];

for subj_num = 1:num_subjs,
   subj_name = ['subj' num2str(subj_num) ];
   this_subj_base_dir = [base_dir subj_name '/'];
   this_subj_VT_mask_dir = [ this_subj_base_dir 'SPM/VT_mask/' ];
   [normed_vt_mask,dir] = spm_select('ExtFPList',this_subj_VT_mask_dir,['^wmask4.*\.nii$' ]);
   all_VT_masks = [ all_VT_masks; normed_vt_mask ]; 
end;

V = spm_vol(all_VT_masks);
m = spm_read_vols(V);

average_mask_dir = [ base_dir 'Average_VT_masks/' ];
cd(average_mask_dir);
V_one_mask = spm_vol(normed_vt_mask);
Vmean = V_one_mask;
Vmean.fname = 'six_subj_mean_VT.nii';
spm_write_vol(Vmean,mean(m,4));  % Average across the 4th dimension

%%% Make a mask such that at least half of the subject-specific masks have voxels there
m_half_or_more = (m >= 0.5);
V_half_or_more = Vmean;
V_half_or_more.fname = 'six_subj_mean_VT_gt_05.nii';
spm_write_vol(V_half_or_more,mean(m_half_or_more,4));  % Average across the 4th dimension



   