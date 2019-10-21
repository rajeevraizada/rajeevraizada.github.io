# Code to run control analyses described in the
# Supplementary Information accompanying the paper
# "What makes different people's representations alike:
#  neural similarity-space solves the problem of across-subject fMRI decoding"
#  by Raizada & Connolly.
# This code was written by Rajeev Raizada, March 2011.

from mvpa.suite import *
import os
from matplotlib.pyplot import figure, show
from mvpa.misc.io.base import SampleAttributes
from mvpa.datasets.mri import fmri_dataset
import scipy
import scipy.stats
import scipy.spatial  # For the squareform function
#import mvpa.base.hdf5 # For writing the results in a Matlab-readable format

pymvpa_datadbroot = '/data3/Haxby_data/All_six_subjects/'
HarvardOxford_path = os.path.join(pymvpa_datadbroot,'HarvardOxford_masks')

num_subjs = 6
num_categories = 8
num_HarvardOxford_rois = 48
num_squareform_vals = num_categories * (num_categories-1) / 2
all_subjs_squareform_sims = scipy.zeros((num_subjs,num_HarvardOxford_rois,num_squareform_vals),float)

for subj_num in range(num_subjs):
    subj_string = 'subj' + str(subj_num + 1) 
    subjpath = os.path.join(pymvpa_datadbroot, subj_string)
    normed_bold_subjpath = os.path.join(pymvpa_datadbroot, subj_string,'SPM/4D_normalised')
    normed_bold_nii_file = 'w' + subj_string + '_bold.nii'
    attrs = SampleAttributes(os.path.join(subjpath, 'labels.txt'),header=True)

    for roi_num in range(num_HarvardOxford_rois):
        print "About to import the dataset for " + subj_string + " ROI " + str(roi_num+1)
        HarvardOxford_roi_name = 'HarvardOxford_haxby_normed_' + str(roi_num+1) + '.nii.gz'
                
        my_dataset = mvpa.datasets.mri.fmri_dataset( samples=os.path.join(normed_bold_subjpath,normed_bold_nii_file),
             targets=attrs.labels,chunks=attrs.chunks,mask=os.path.join(HarvardOxford_path,HarvardOxford_roi_name))
        detrender = PolyDetrendMapper(polyord=1, chunks_attr='chunks')
        detrended_dataset = my_dataset.get_mapped(detrender)
        zscore(detrended_dataset,param_est=('targets', ['rest']))
        # Now remove the rest periods
        detrended_dataset_without_rest_periods = detrended_dataset[detrended_dataset.sa.targets != 'rest']
        averager = mean_group_sample(['targets'])
        averaged_dataset = detrended_dataset_without_rest_periods.get_mapped(averager)
        averaged_fMRI_values = averaged_dataset.samples
        # Now make the correlation matrix
        sim_matrix = scipy.corrcoef(averaged_fMRI_values)
        # It seems that the squareform command is very picky about matrix symmetry,
        # so that even rounding errors make it give an error.
        # So, we need to turn off that checking. 
        # Also, we are using similarities instead of 1-corr,
        # so the diagonal is made of ones, not zeros.
        this_squareform_vec = scipy.spatial.distance.squareform(sim_matrix,checks=False)
        all_subjs_squareform_sims[subj_num,roi_num,:] = this_squareform_vec

scipy.io.savemat('normed_haxby2001_HarvOxf_sim_matrices.mat',{'all_subjs_squareform_sims':all_subjs_squareform_sims})

