### Interactively plot points
### to show the two-sample t-test of the y-values.
### By Rajeev Raizada, Jan.2011.
### Requires Python, with the Matplotlib, NumPy and SciPy modules.
### You can download Python and those modules for free from
### http://www.python.org/download
### http://numpy.org
### http://scipy.org
### http://matplotlib.sourceforge.net
### A good way to get all these modules at once is to use
### the Anaconda python distribution, from
### https://www.anaconda.com/distribution/
###
### Please feel more than free to use this code for teaching.
### If you use it, I'd love to hear from you!
### If you have any questions, comments or feedback, 
### please send them to me: rajeev dot raizada at gmail dot com
###
### Some tutorial exercises which might be useful to try:
### 1. Click in the left-half of the figure
###    to make a few points in Group A with a mean of around 5,
###    and in the right-half to make a few points in Group B
###    with a mean of around 10.
###    The red bars show the 95% confidence interval for each group.
###    This means that if the data points were randomly sampled
###    from a broader group-population, then we can be 95% sure
###    that the actual mean of that broader group-population
###    sits somewhere within that confidence-interval.
### 2. What is the size of the p-value of the two-sample t-test for the groups you made?
###    What is the size of the t-value for the difference between the two group-means?
###    The meaning of the p-value is that it is the probability of observing 
###    that t-value, if the two group-populations that the data points 
###    were sampled from actually had the same means as each other.
###    How much overlap is there between the 95% confidence intervals
###    of the two groups?
### 3. Click to add or delete some points so that the confidence intervals
###    of the two groups become more overlapping with each other.
###    What is the new t-value? What is the new p-value?
### 4. Can you make two groups which have quite similar mean-values,
###    but where those mean-values are still significantly different from each other?
### 5. Now try to make two groups which have very different means,
###    but where the mean-values are *not* significantly different from each other.

###########################################
# First, we import the modules that we need
import pylab as plt
import numpy as np
import scipy.stats  # We need this one for the norm.pdf function

#####################################################
# Next, we define the functions that the program uses

### This function clears the figure and empties the points list
def clear_the_figure_and_empty_points_list():
    global coords_array 
    global point_handles_array  
    # Reset our variables to be empty
    coords_array = np.array([])
    point_handles_array = np.array([])
    handle_of_conf_ints_plot = []
    handle_of_means_plot = []
    ### Clear the figure window
    plt.clf()  # clf means "clear the figure"
    ### In order to keep the boundaries of the figure fixed in place,
    ### we will draw a black box around the region that we want.
    plt.plot(axis_x_range*np.array([-1, 1, 1, -1]),
           np.array([axis_y_lower_lim,axis_y_lower_lim,axis_y_upper_lim,axis_y_upper_lim]),'k-')
    ### We want a long title, so we put a \n in the middle, to start a new line of title-text      
    multiline_title_string = 'Click to add points, on old points to delete,' \
                             ' outside axes to reset.\n' \
                             'Dots show the means. Bars show 95% confidence intervals for means'   
    plt.title(multiline_title_string)
    ### Plot a line at x=0, which divides the Group A side from the Group B side
    plt.plot([0, 0],[axis_y_lower_lim, axis_y_upper_lim ],'k--')
    plt.grid(True)  # Add a grid on to the figure window
    plt.axis([-axis_x_range, axis_x_range, axis_y_lower_lim, axis_y_upper_lim])
    ### Because we are only looking at the y-axis mean and std,
    ### we will only show tick-labels on the y-axis, with no ticks on the x-axis
    plt.yticks( np.arange(axis_y_lower_lim,axis_y_upper_lim,5) )
    plt.xticks([-axis_x_range*0.5, axis_x_range*0.5],['Group A','Group B'])
    plt.draw()  # Make sure that the newly cleaned figure is drawn

    
# This is the function which gets called when the mouse is clicked in the figure window
def do_this_when_the_mouse_is_clicked(this_event):
    global coords_array 
    global point_handles_array
    x = this_event.xdata
    y = this_event.ydata
    ### If the click is outside the range, then clear figure and points list
    if this_event.xdata is None: # This means we clicked outside the axis
        clear_the_figure_and_empty_points_list()
    else: # We clicked inside the axis
        ### First, check to see if we are clicking on an existing point, to delete it
        ### This can only happen if there are more than zero points.
        number_of_points = np.shape(coords_array)[0]
        if number_of_points > 0:
            point_to_be_deleted = check_if_click_is_on_an_existing_point(x,y) 
        else:
            point_to_be_deleted = -1  # We are using this to code "No point to be deleted"
        ### If a value of point_to_be_deleted other than -1 is returned,
        ### then that value is the row-number of the point we are going to delete
        if point_to_be_deleted != -1: # We delete a point
            # We will delete that row from coords_array. The rows are axis 0
            coords_array = np.delete(coords_array,point_to_be_deleted,0)
            # We will also hide that point on the figure, by finding its handle
            handle_of_point_to_be_deleted = point_handles_array[point_to_be_deleted]
            plt.setp(handle_of_point_to_be_deleted,visible=False)
            # Now that we have erased the point with that handle,
            # we can delete that handle from the handles list
            point_handles_array = np.delete(point_handles_array,point_to_be_deleted)
            # After this possible point deletion, let's re-check
            # to see whether we have fewer than two points in either class.
            # If we do, then delete the mean and confidence interval for that class, 
            # as it isn't meaningful for just one data point
            group_A_points = np.nonzero(coords_array[:,0] < 0)
            group_B_points = np.nonzero(coords_array[:,0] >= 0)
            number_of_points_A = np.shape(group_A_points)[1]
            number_of_points_B = np.shape(group_B_points)[1]
            # Also, let's re-check whether there are still enough points
            # for a two-sample t-test to be meaningful.
            # If neither of the classes has two or more points,
            # or either of the classes is empty,
            # then we will delete the two-sample t-test results.
            if ( (np.maximum(number_of_points_A,number_of_points_B)<2) | \
                 (np.minimum(number_of_points_A,number_of_points_B)==0) ):
                plt.xlabel('')
                plt.ylabel('')
        else:  # We are not deleting any point, so we are making a new point
            ### We are going to treat all the points to the left of x=0 as Group A,
            ### and all the points to the right of x=0 as Group B.
            ### We'll plot Group A in blue, and Group B in black
            if x < 0:  ### Group A
                colour_of_this_point = 'blue'
            else:      ### Group B
                colour_of_this_point = 'black'
            ### We need slightly different commands for adding a row of coords
            ### to an existing coords_array when there are already some points,
            ### versus making the very first row of a new array, for the first point.
            number_of_points = np.shape(coords_array)[0]
            if number_of_points > 0:
                coords_array = np.vstack((coords_array,[x,y])) # Add a new row
            else: # This is the first point
                coords_array = np.array([[x,y]]) # Make the very first row
            ### Plot the new point in the group-appropriate colour, and record its handle
            new_point_handle = plt.plot(x,y,'*',color=colour_of_this_point)
            point_handles_array = np.append(point_handles_array,new_point_handle) 
        ### Now plot the statistics that this program is demonstrating
        number_of_points = np.shape(coords_array)[0] # Recount how many points we have now
        if number_of_points > 1: 
            plot_the_two_sample_t_test()
        # Set the axis back to its original value, in case Python has changed it during plotting
        plt.axis([-axis_x_range, axis_x_range, axis_y_lower_lim, axis_y_upper_lim])
        plt.draw()  # Make sure that the new changes to the figure are drawn


# This is the function which calculates and plots the statistics
def plot_the_two_sample_t_test():
    # First, delete any existing normal-curve and mean plots from the figure
    global handle_of_group_A_conf_int
    global handle_of_group_B_conf_int
    global handle_of_group_A_mean
    global handle_of_group_B_mean
    plt.setp(handle_of_group_A_conf_int,visible=False)
    plt.setp(handle_of_group_B_conf_int,visible=False)
    plt.setp(handle_of_group_A_mean,visible=False)
    plt.setp(handle_of_group_B_mean,visible=False)
    #### Next, calculate and plot the stats
    #### We do this separately for Group A and Group B
    #### The groupes are defined by whether their x-coord is > 0 or < 0
    group_A_points = np.nonzero(coords_array[:,0] < 0)
    group_B_points = np.nonzero(coords_array[:,0] >= 0)
    number_of_points_A = np.shape(group_A_points)[1]
    y_coords_A = coords_array[group_A_points,1] # y-coords are the second column, which is 1 in Python
    if number_of_points_A > 1:
        y_mean_A = np.average(y_coords_A)
        y_std_A = np.std(y_coords_A) 
        y_ste_A = y_std_A / np.sqrt(number_of_points_A) # ste stands for Standard Error of the Mean
        df_A = number_of_points_A - 1   # df stands for "degrees of freedom"
        t_crit_A = scipy.stats.t.ppf(0.975,df_A)  # 95% critical value of t, two-tailed
        confidence_interval_A = y_mean_A + t_crit_A*y_ste_A*np.array([-1,1])
        ### Now plot the mean and confidence interval for this group
        ### For more explanation of what the confidence interval means,
        ### see the accompanying script interactive_one_sample_t_test.py 
        handle_of_group_A_mean = plt.plot(-axis_x_range*0.5,y_mean_A,'bo',markersize=10)
        handle_of_group_A_conf_int = plt.plot([-axis_x_range*0.5, -axis_x_range*0.5], \
                                                 confidence_interval_A,'r-',linewidth=3)                                              
    #### Now do the same for Group B
    number_of_points_B = np.shape(group_B_points)[1]
    y_coords_B = coords_array[group_B_points,1] # y-coords are the second column, which is 1 in Python
    if number_of_points_B > 1:
        y_mean_B = np.average(y_coords_B)    
        y_std_B = np.std(y_coords_B) 
        y_ste_B = y_std_B / np.sqrt(number_of_points_B) # ste stands for Standard Error of the Mean
        df_B = number_of_points_B - 1   # df stands for "degrees of freedom"
        t_crit_B = scipy.stats.t.ppf(0.975,df_B)  # 95% critical value of t, two-tailed
        confidence_interval_B = y_mean_B + t_crit_B*y_ste_B*np.array([-1,1])
        ### Now plot the mean and confidence interval for this group
        handle_of_group_B_mean = plt.plot(axis_x_range*0.5,y_mean_B,'ko',markersize=10)
        handle_of_group_B_conf_int = plt.plot([axis_x_range*0.5, axis_x_range*0.5], \
                                                 confidence_interval_B,'r-',linewidth=3)                                              
    #### Next: if both the classes have two or more points, then we will 
    #### perform the two-sample t-test and display the results.
    if np.minimum(number_of_points_A,number_of_points_B) > 1:
        #### SciPy refers to its two-sample t-test as ttest_ind,
        #### meaning that this is the test two use for two independent groups.
        #### It requires that the inputs be column vectors, so we need to flip them
        y_coords_A_column_vec = y_coords_A.reshape(-1,1)
        y_coords_B_column_vec = y_coords_B.reshape(-1,1)    
        [t_value_AvsB,p_value_AvsB] = scipy.stats.ttest_ind(y_coords_A_column_vec, \
                                                            y_coords_B_column_vec)  
        #### In order to make the p-values format nicely
        #### even when they have a bunch of zeros at the start, we do this:
        p_value_string = "%1.2g" % p_value_AvsB                                                         
        plt.xlabel('Mean-A=' + str(round(y_mean_A,2))  + \
                     ', Mean-B=' + str(round(y_mean_B,2)) + \
                     ', t=' + str(round(t_value_AvsB[0],2)) + \
                     ', p= ' + p_value_string, fontsize=14)
        plt.ylabel('n(A)=' + str(number_of_points_A) + \
                     ', n(B)=' + str(number_of_points_B) + \
                     ', df=' + str(number_of_points_A+number_of_points_B-2), \
                     fontsize=14)
                     # Note: this df=n(A)+n(B)-2 formula is for the simple case
                     # where the two-sample t-test assumes that the two groups
                     # have equal variance, which is what we are doing here.
    # Set the axis back to its original value, in case Python has changed it during plotting
    plt.axis([-axis_x_range, axis_x_range, axis_y_lower_lim, axis_y_upper_lim])

        
# This is the function which deletes existing points if you click on them       
def check_if_click_is_on_an_existing_point(mouse_x_coord,mouse_y_coord):
    # First, figure out how many points we have.
    # Each point is one row in the coords_array,
    # so we count the number of rows, which is dimension-0 for Python
    number_of_points = np.shape(coords_array)[0]    
    this_coord = np.array([[ mouse_x_coord, mouse_y_coord ]]) 
            # The double square brackets above give the this_coord array 
            # an explicit structure of having rows and also columns
    if number_of_points > 0:  
        # If there are some points, we want to calculate the distance
        # of the new mouse-click location from every existing point.
        # One way to do this is to make an array which is the same size
        # as coords_array, and which contains the mouse x,y-coords on every row.
        # Then we can subtract that xy_coord_matchng_matrix from coords_array
        ones_vec = np.ones((number_of_points,1))
        xy_coord_matching_matrix = np.dot(ones_vec,this_coord)
        distances_from_existing_points = (coords_array - xy_coord_matching_matrix)
        # Because the x and y axes have different scales,
        # we need to rescale the distances so that itdoesn't matter whether
        # you try to delete a dot by clicking near it in the x or y directions.
        # When we extract the columns of distances_from_existing_points,
        # scipy returns the values as row vectors for some reason.
        # So, we transpose them back to column vectors and stack them horizontally
        axis_range_scaled_distances = np.hstack( \
            ( distances_from_existing_points[:,0].reshape(-1,1)/(2*axis_x_range), \
              distances_from_existing_points[:,1].reshape(-1,1)/(axis_y_upper_lim-axis_y_lower_lim) ) )
        squared_distances_from_existing_points = axis_range_scaled_distances**2
        sum_sq_dists = np.sum(squared_distances_from_existing_points,axis=1) 
                   # The axis=1 means "sum over dimension 1", which is columns for Python          
        euclidean_dists = np.sqrt(sum_sq_dists)
        distance_threshold = 0.01
        within_threshold_points = np.nonzero(euclidean_dists < distance_threshold )
        num_within_threshold_points = np.shape(within_threshold_points)[1]
        if num_within_threshold_points > 0:
            # We only want one matching point.
            # It's possible that more than one might be within threshold.
            # So, we take the unique smallest distance
            point_to_be_deleted = np.argmin(euclidean_dists)
            return point_to_be_deleted
        else: # If there are zero points, then we are not deleting any 
            point_to_be_deleted = -1
            return point_to_be_deleted


#######################################################################
# This is the main part of the program, which calls the above functions 
#######################################################################
# First, initialise some of our variables to be empty
coords_array = np.array([])
point_handles_array = np.array([])
handle_of_group_A_conf_int = []
handle_of_group_B_conf_int = []
handle_of_group_A_mean = []
handle_of_group_B_mean = []
### Set up an initial space to click inside
axis_x_range = 30
axis_y_upper_lim = 20
axis_y_lower_lim = -10
### Make the figure window
plt.figure()
### Clear the figure window
plt.clf() # clf means "clear the figure"
### In order to keep the boundaries of the figure fixed in place,
### we will draw a black box around the region that we want.
plt.plot(axis_x_range*np.array([-1, 1, 1, -1]), \
           np.array([axis_y_lower_lim,axis_y_lower_lim,axis_y_upper_lim,axis_y_upper_lim]),'k-')
### Tell Python to call a function every time
### when the mouse is pressed in this figure
plt.connect('button_press_event', do_this_when_the_mouse_is_clicked)

clear_the_figure_and_empty_points_list()
plt.show()    # This shows the figure window onscreen
    





