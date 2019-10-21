%%%% To grab the SPM99 MIP values from a results plot,
%%%% and replot them with the brain pixels colored
%%%% according to the orange-ish parts of the hot colormap.
%%%% Written by Rajeev Raizada, May 20, 2003.
%%%% raj@nmr.mgh.harvard.edu

%%%% First, make the results plot in SPM99,
%%%% using the results button.
%%%% Do not make any overlays, just have the glass brain

figure(1);   %%% This is the SPM results plot window

ch = get(gcf,'children');

mip_handle = ch(7);  %%% The 7th plot child
                     %%% This includes the text that goes with MIP

mip_children = get(mip_handle,'children');           

mip_image = mip_children(9);  %%% The ninth child is the actual image

mip_cdata = get(mip_image,'cdata'); %% A 364x400 matrix

%%% The background pixels are colored in with value 64
bg_val = 64;
background_pixels = find(mip_cdata==bg_val);

%%% The grid has value 38.4
%%% This is a gray val of 0.6 in colormap gray(64)
%%% since 38.4 = 0.6 * 64
grid_val = 38.4;
grid_points = find(mip_cdata==grid_val);

brain_points = find(mip_cdata~=grid_val & mip_cdata~=bg_val);

%%% Make masks to show only the brain points and the background
brain_points_mask = zeros(size(mip_cdata));
brain_points_mask(brain_points) = 1;

background_mask = zeros(size(mip_cdata));
background_mask(background_pixels) = 1;

brain_points_cdata = mip_cdata .* brain_points_mask;

%%% Show the MIP, in a restricted version of the
%%% hot colormap, so the most intense points become
%%% dark orange instead of black, and the lighted points
%%% become light orange instead of yellow.
%%% Show the grid as 0.6 gray, and the backgroud white

%%% So that we sample only from the darker part
%%% of the hot colormap, we'll stretch it to 180
%%% rows, and pull out 64 rows from near the start.
%%% Change these numbers if you want to sample 
%%% different colours

num_stretched_cmap_rows = 180; 
        %%% Reduce this to cover more of hotmap

stretched_hotmap = hot(num_stretched_cmap_rows); 

row_to_start_sampling = 50;  %%% Increase this to make yellower

restricted_hotmap_64rows = ...
           stretched_hotmap( row_to_start_sampling + [1:64], : );

pic_to_show = mip_cdata;
pic_to_show(grid_points) = 65;  %%% The 65th row of the new cmap
pic_to_show(background_pixels) = 66;  %%% The 66th row of new cmap

hotmap_with_gray_and_white = [ restricted_hotmap_64rows; ...
                               0.6*[1 1 1]; ...
                               1 1 1 ];

figure(2);
clf;
colormap(hotmap_with_gray_and_white);
image(pic_to_show);
axis('image');
colorbar;

%%% Now show the three views in different figure windows,
%%% and write them as color EPS files, for turning into PDFs,
%%% or direct importing into Adobe Illustrator

%%% Show sagittal view
figure(3);
clf;
colormap(hotmap_with_gray_and_white);
image(pic_to_show(20:180,15:210));
axis('image');
axis('off');

%%% Show coronal view
figure(4);
clf;
colormap(hotmap_with_gray_and_white);
image(pic_to_show(20:180,230:385));
axis('image');
axis('off');


%%% Show axial view
figure(5);
clf;
colormap(hotmap_with_gray_and_white);
image(pic_to_show(195:355,15:210));
axis('image');
axis('off');

write_yn = input('Write brain views to EPS files (y/n) ? ','s');

if write_yn == 'y',
  figure(3);
  print -depsc colored_mip_sagittal.eps
  figure(4);
  print -depsc colored_mip_coronal.eps
  figure(5);
  print -depsc colored_mip_axial.eps
end;