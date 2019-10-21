% Code to run control analyses described in the
% Supplementary Information accompanying the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.

HarvOxf_dir = '/data3/Haxby_data/All_six_subjects/HarvardOxford_masks/';
cd(HarvOxf_dir);

spm_defaults;

num_HarvOxf_rois = 48;

V_HarvOxf = spm_vol([HarvOxf_dir 'HarvardOxford-cort-maxprob-thr0-2mm.nii']);
m_HarvOxf = spm_read_vols(V_HarvOxf);

V_results = V_HarvOxf;
V_results.fname = 'HarvOxf_across_subj_pcorrect_results_image.nii';
V_results.dt = [ 16 0 ];
m_results = zeros(size(m_HarvOxf));

for roi_num = 1:num_HarvOxf_rois,
   
   disp(['ROI num: ' num2str(roi_num) ]);
   this_roi = (m_HarvOxf==roi_num);
   
   m_results(find(this_roi)) = mean_subj_prop_correct(roi_num);
  
end;

spm_write_vol(V_results,m_results);

   