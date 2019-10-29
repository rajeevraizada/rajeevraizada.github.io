### Interactively plot points
### to show the one-sample t-test of the y-values, against zero.
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
### 1. Click to make 10 points with a mean y-value of around 5,
###    and a standard deviation of around 10.
###    (The points will need to be quite spread-out for this).
###    The red bars show the 95% confidence interval.
###    This means that if the data points were randomly sampled
###    from a broader population, then we can be 95% sure
###    that the actual mean of that broader population
###    sits somewhere within that confidence-interval.
###    Does this 95% confidence interval include the value y=0?
###    What is the size of the p-value of the t-test?
###    The meaning of this p-value is that it is the probability of observing
###    that t-value, if the population that the points were sampled from 
###    actually had a mean equal to zero.
### 2. Now add another 10 points, keeping the mean the same at around 5,
###    and the standard devation the same at around 10.
###    What happens to the size of the 95% confidence interval?
###    Does this confidence interval include y=0 now?
###    What is the new p-value?

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
    handle_of_conf_int_plot = []
    handle_of_mean_plot = []
    ### Clear the figure window
    plt.clf()  # clf means "clear the figure"
    ### In order to keep the boundaries of the figure fixed in place,
    ### we will draw a black box around the region that we want.
    plt.plot(axis_x_range*np.array([-1, 1, 1, -1]),
           np.array([axis_y_lower_lim,axis_y_lower_lim,axis_y_upper_lim,axis_y_upper_lim]),'k-')
    ### We want a long title, so we put a \n in the middle, to start a new line of title-text      
    multiline_title_string = 'Click to add points, on old points to delete,' \
                             ' outside axes to reset.\n' \
                             'Dot shows the mean. Bars show 95% confidence interval for mean'   
    plt.title(multiline_title_string)
    ### Plot the zero line, against which the t-test is performed
    plt.plot([-axis_x_range, axis_x_range],[0, 0],'k--')
    plt.grid(True)  # Add a grid on to the figure window
    plt.axis([-axis_x_range, axis_x_range, axis_y_lower_lim, axis_y_upper_lim])
    ### Because we are only looking at the y-axis mean and std,
    ### we will only show tick-labels on the y-axis, with no ticks on the x-axis
    plt.yticks( np.arange(axis_y_lower_lim,axis_y_upper_lim,5) )
    plt.xticks([])
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
        number_of_points = np.shape(coords_array)[0]
        if number_of_points > 0:
            point_to_be_deleted = check_if_click_is_on_an_existing_point(x,y)  
            if point_to_be_deleted != -1: # We delete a point
                # We will delete that row from coords_array. The rows are axis 0
                coords_array = np.delete(coords_array,point_to_be_deleted,0)
                # We will also hide that point on the figure, by finding its handle
                handle_of_point_to_be_deleted = point_handles_array[point_to_be_deleted]
                plt.setp(handle_of_point_to_be_deleted,visible=False)
                # Now that we have erased the point with that handle,
                # we can delete that handle from the handles list
                point_handles_array = np.delete(point_handles_array,point_to_be_deleted)
            else:  # We make a new point
                coords_array = np.vstack((coords_array,[x,y]))
                new_point_handle = plt.plot(x,y,'*',color='blue')
                point_handles_array = np.append(point_handles_array,new_point_handle) 
        if number_of_points == 0:
            coords_array = np.array([[x,y]])
            new_point_handle = plt.plot(x,y,'*',color='blue')
            point_handles_array = np.append(point_handles_array,new_point_handle)
        ### Now plot the statistics that this program is demonstrating
        number_of_points = np.shape(coords_array)[0] # Recount how many points we have now
        if number_of_points > 1: 
            plot_the_one_sample_t_test()
        ### Finally, check to see whether we have fewer than two points
        ### as a result of any possible point-deletions above.
        ### If we do, then delete the stats info from the plot, 
        ### as it isn't meaningful for just one data point
        number_of_points = np.shape(coords_array)[0]  
        if number_of_points < 2: # We only show mean and std if there are two or more points
            plt.setp(handle_of_conf_int_plot,visible=False)
            plt.setp(handle_of_mean_plot,visible=False)       
            plt.xlabel('')
            plt.ylabel('')
        # Set the axis back to its original value, in case Python has changed it during plotting
        plt.axis([-axis_x_range, axis_x_range, axis_y_lower_lim, axis_y_upper_lim])
        plt.draw()  # Make sure that the new changes to the figure are drawn


# This is the function which calculates and plots the statistics
def plot_the_one_sample_t_test():
    # First, delete any existing normal-curve and mean plots from the figure
    global handle_of_conf_int_plot
    global handle_of_mean_plot
    plt.setp(handle_of_conf_int_plot,visible=False)
    plt.setp(handle_of_mean_plot,visible=False)   
    #### Next, calculate and plot the stats
    number_of_points = np.shape(coords_array)[0]  
    y_coords =  coords_array[:,1]  ### y-coords are the second column, which is 1 in Python
    y_mean = np.average(y_coords)
    y_std = np.std(y_coords)
    y_ste = y_std / np.sqrt(number_of_points); # ste stands for Standard Error of the Mean
    [t_value,p_value] = np.stats.ttest_1samp(y_coords,0)
    #### Let's also calculate the 95% confidence interval.
    #### This is the range such that, if we we draw a sample 
    #### from a population whose true population-mean is y_mean, 
    #### then that sample's mean will lie within the confidence-interval
    #### 95% of the time.
    #### First, we need the critical value of t (two-tailed). 
    #### Because we are using a two-tailed test, that means that 
    #### we want to cover the middle 95% of the range of t-value,
    #### i.e. with 2.5% in each tail on either end.
    #### So, we want a t-crit value such that there is a 97.5% chance
    #### of getting a sample with a t-score of *less than* t_crit.
    #### To get this t_crit value, we need an inverse-t function
    #### and also the number of degrees-of-freedom (often called df),
    #### which for a one-sample t-test is simply (number_of_points-1)
    df = number_of_points - 1
    #### In SciPy, the inverse stats functions are named 
    #### a bit differently from usual. 
    #### The inverse-t function is called t.ppf,
    #### where ppf stands for "percent point function".
    #### That's not the standard name. 
    #### Usually, this inverse t-function is referred to as
    #### the inverse of the CDF (cumulative distribution function).
    t_crit = np.stats.t.ppf(0.975,df)  # 95% critical value of t, two-tailed
    #### The 95% confidence interval is the range between
    #### t_crit standard errors below the mean, and t_crit ste's above.
    confidence_interval = y_mean + t_crit * y_ste * np.array([-1,1])
    #### Now, plot the mean and confidence interval in red
    handle_of_mean_plot = plt.plot(0,y_mean,'ro',markersize=10)
    handle_of_conf_int_plot = plt.plot([0, 0],confidence_interval,'r-',linewidth=3)
    #### In order to make the p-values format nicely
    #### even when they have a bunch of zeros at the start, we do this:
    p_value_string = "%1.2g" % p_value 
    plt.xlabel('Mean=' + str(round(y_mean,2)) + \
                 ', STE=STD/sqrt(n)=' + str(round(y_ste,2)) + \
                 ', t=Mean/STE=' + str(round(t_value,2)) + \
                 ', p= ' + p_value_string, fontsize=11)
    plt.ylabel('n = ' + str(number_of_points) + \
                 ',  STD = ' + str(round(y_std,2)), fontsize=12)
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
handle_of_conf_int_plot = []
handle_of_mean_plot = []
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
    





