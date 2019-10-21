# Code to run the analyses in the paper
# "What makes different people's representations alike:
#  neural similarity-space solves the problem of across-subject fMRI decoding"
#  by Raizada & Connolly.
# This code was written by Rajeev Raizada, March 2011.
#
# It reads in the data from the Haxby 2001 dataset,
# which is publicly available at:
# http://dev.pymvpa.org/datadb/haxby2001.html
# For this study, we are investigating the activation in VT cortex,
# so we use the VT cortex masks defined by Haxby et al.,
# which are included as part of the overall dataset download.
#
# It writes out a Matlab-format .mat file
# called "haxby2001_sim_matrices_VT.mat",
# containing the similarity matrices for each of the six subjects.
# That data then serves as input for the across-subject decoding Matlab script:
# Step2_AcrossSubjDecoding_SimMatrixPermutationMatching.m
#
# The similarity matrices are stored in "squareform" format, for convenience.
# In squareform format, the 8*(8-1)/2=28 unique values 
# in the 8*8 symmetrical similarity matrix
# are stretched out into a single 28-element vector.
# See http://www.mathworks.com/help/toolbox/stats/squareform.html
#
# This code uses functions from the PyMVPA toolbox,
# freely downloadable from http://www.pymvpa.org
# and is based on:
# http://dev.pymvpa.org/tutorial_mappers.html#doing-get-haxby2001-data-from-scratch
# It also uses functions from the module SciPy,
# which is freely downloadable from http://www.scipy.org	
#
# It shouldn't take too long for this data-importing program to run.
# On an Intel Core2 Quad CPU 2.4GHz running Ubuntu Linux 8.10,
# the whole program runs in around 150 seconds, i.e. about 25s per subject.

from mvpa.suite import *
import os
from mvpa.misc.io.base import SampleAttributes
from mvpa.datasets.mri import fmri_dataset
import scipy
import scipy.stats
import scipy.spatial  # For the squareform function

# Change the location of the root directory, for your local machine:
pymvpa_datadbroot = '/data3/Haxby_data/All_six_subjects/'

num_subjs = 6
num_categories = 8
num_squareform_vals = num_categories * (num_categories-1) / 2
all_subjs_squareform_sims = scipy.zeros((num_subjs,num_squareform_vals),float)

for subj_num in range(num_subjs):
    subj_string = 'subj' + str(subj_num + 1) 
    subjpath = os.path.join(pymvpa_datadbroot, subj_string)
    attrs = SampleAttributes(os.path.join(subjpath, 'labels.txt'),header=True)
    print "About to import the dataset for " + subj_string
    my_dataset = mvpa.datasets.mri.fmri_dataset( samples=os.path.join(subjpath,'bold.nii.gz'),
             targets=attrs.labels,chunks=attrs.chunks,mask=os.path.join(subjpath, 'mask4_vt.nii.gz'))
    detrender = PolyDetrendMapper(polyord=1, chunks_attr='chunks')
    detrended_dataset = my_dataset.get_mapped(detrender)
    zscore(detrended_dataset,param_est=('targets', ['rest']))
    # Now remove the rest periods
    detrended_dataset_without_rest_periods = detrended_dataset[detrended_dataset.sa.targets != 'rest']
    averager = mean_group_sample(['targets'])
    averaged_dataset = detrended_dataset_without_rest_periods.get_mapped(averager)
    averaged_fMRI_values = averaged_dataset.samples
    # Now make the similarity matrix, which consists of the spatial correlations
    # between the condition-average activation patterns.
    sim_matrix = scipy.corrcoef(averaged_fMRI_values)
    # It seems that the squareform command is very picky about matrix symmetry,
    # so that even rounding errors make it give an error.
    # So, we need to turn off that checking. 
    # Also, we are using similarities instead of 1-corr,
    # so the diagonal is made of ones, not zeros.
    this_squareform_vec = scipy.spatial.distance.squareform(sim_matrix,checks=False)
    all_subjs_squareform_sims[subj_num,:] = this_squareform_vec

scipy.io.savemat('haxby2001_sim_matrices_VT.mat',{'all_subjs_squareform_sims':all_subjs_squareform_sims})

