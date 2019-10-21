# Code to run control analyses described in the
# Supplementary Information accompanying the paper
# "What makes different people's representations alike:
#  neural similarity-space solves the problem of across-subject fMRI decoding"
#  by Raizada & Connolly.
# This code was written by Rajeev Raizada, March 2011.
#
# It reads in the data from the Haxby 2001 dataset,
# after that data has been spatially normalised into MNI space
# by the Matlab and SPM sript:
# split_and_spatially_normalise_haxby_data.m
#
# The Haxby data is publicly available at:
# http://dev.pymvpa.org/datadb/haxby2001.html
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
from matplotlib.pyplot import figure, show
from mvpa.misc.io.base import SampleAttributes
from mvpa.datasets.mri import fmri_dataset
import scipy
import scipy.stats
import scipy.spatial  # For the squareform function
import numpy

pymvpa_datadbroot = '/data3/Haxby_data/All_six_subjects/'
masks_path = os.path.join(pymvpa_datadbroot,'Masks_test')
target_labels = ['bottle', 'cat', 'chair', 'face', 'house', 'scissors', 'scrambledpix', 'shoe', 'rest']
num_categories = len(target_labels)
num_subjs = 6


for subj_num in range(num_subjs):
    subj_string = 'subj' + str(subj_num + 1) 
    subjpath = os.path.join(pymvpa_datadbroot, subj_string)
    normed_bold_subjpath = os.path.join(pymvpa_datadbroot, subj_string,'SPM/4D_normalised')
    normed_bold_nii_file = 'w' + subj_string + '_bold.nii'
    attrs = SampleAttributes(os.path.join(subjpath, 'labels.txt'),header=True)

    print "About to import the dataset for " + subj_string
    my_dataset = mvpa.datasets.mri.fmri_dataset( samples=os.path.join(normed_bold_subjpath,normed_bold_nii_file),
             targets=attrs.labels,chunks=attrs.chunks,mask=os.path.join(masks_path,'wholebrain_mask_haxby_space.nii.gz'))
    num_voxels = my_dataset.shape[1]

    this_subj_data = scipy.zeros(num_categories,dtype=numpy.object)

    detrender = PolyDetrendMapper(polyord=1, chunks_attr='chunks')
    detrended_dataset = my_dataset.get_mapped(detrender)
    
    for target_num in range(num_categories):
        this_target = target_labels[target_num]
        data_for_this_target = detrended_dataset[detrended_dataset.sa.targets == this_target]
        this_subj_data[target_num] = data_for_this_target.samples
        print this_target + str(data_for_this_target.shape)

    # Now save the results into a Matlab .mat file        
    data_to_save = {}
    data_to_save[subj_string + '_data'] = this_subj_data
    data_to_save[subj_string + '_voxel_coords'] = detrended_dataset.fa.voxel_indices

    filename_to_save = os.path.join(pymvpa_datadbroot,'Mat_files/') + subj_string + 'whole_brain.mat'
    scipy.io.savemat(filename_to_save,data_to_save)



